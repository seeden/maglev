import express from 'express';
import debug from 'debug';
import http from 'http';
import isArray from 'lodash/isArray';

import expressDomainMiddleware from 'express-domain-middleware';
import compression from 'compression';
import serveFavicon from 'serve-favicon';
import serveStatic from 'serve-static';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import responseTime from 'response-time';
import timeout from 'connect-timeout';
import morgan from 'morgan';
import cors from 'cors';
import lessMiddleware from 'less-middleware';

import request from 'express/lib/request';
import consolidate from 'consolidate';
import flash from 'connect-flash';
import robots from 'robots.txt';
import MiddlewareType from './constants/MiddlewareType';

import * as fileController from './controllers/file';
import * as pageController from './controllers/page';

const log = debug('maglev:app');

function connectionToUnique(conn) {
  return `${conn.remoteAddress}:${conn.remotePort}`;
}


export default class App {
  constructor(server, options = {}) {
    if (!options.root) {
      throw new Error('Root is undefined');
    }

    log(`App root: ${options.root}`);

    this._server = server;
    this._options = options;
    this._expressApp = express();
    this._httpServer = null;
    this._activeConnections = {};

    // prepare basic
    this._prepareErrorHandler();
    this._prepareCompression();
    this._prepareLog();
    this._prepareEngine();
    this._prepareHtml();

    this._prepareMiddleware(MiddlewareType.BEFORE_STATIC);

    // prepare static
    this._prepareStatic();

    // prepare middlewares
    this._prepareVars();
    this._prepareSession();
    this._prepareSecure();
    this._prepareMiddleware(MiddlewareType.BEFORE_ROUTER);
    this._prepareRouter();
    this._prepareMiddleware(MiddlewareType.AFTER_ROUTER);
  }

  get options() {
    return this._options;
  }

  get activeConnections() {
    return this._activeConnections;
  }

  get server() {
    return this._server;
  }

  get httpServer() {
    return this._httpServer;
  }

  get expressApp() {
    return this._expressApp;
  }

  listen(port, host, callback) {
    if (this._httpServer) {
      return callback(new Error('You need to close http server first'));
    }

    this._httpServer = http
      .createServer(this.expressApp)
      .listen(port, host, callback);

    this.handleConnectionEvents();

    return this;
  }

  handleConnectionEvents() {
    // TODO UNHANDLE
    const { activeConnections, httpServer } = this;

    httpServer.on('connection', function onConnectionCallback(connection) {
      const key = connectionToUnique(connection);
      activeConnections[key] = {
        connection,
        requests: 0,
      };

      connection.once('close', function onCloseCallback() {
        if (activeConnections[key]) {
          delete activeConnections[key];
        }
      });
    });

    httpServer.on('request', function onRequestCallback(request, response) {
      const key = connectionToUnique(request.connection);

      const settings = activeConnections[key];
      if (!settings) {
        return;
      }

      settings.requests++;

      response.once('finish', function onFinishCallback() {
        const settings = activeConnections[key];
        if (!settings) {
          return;
        }

        settings.requests--;
      });
    });
  }

  _destroyUnusedConnections() {
    const { activeConnections } = this;

    // remove unused connections
    Object.keys(activeConnections).forEach(function destroyConnection(key) {
      const settings = activeConnections[key];
      if (settings.requests) {
        return;
      }

      settings.connection.destroy();
      delete activeConnections[key];
    });
  }

  close(callback) {
    const { activeConnections, httpServer, options } = this;

    if (!httpServer) {
      return callback(new Error('You need to listen first'));
    }

    log('Closing http server');
    httpServer.close((err) => {
      if (err) {
        return callback(err);
      }

      this._httpServer = null;

      // check current state of the connections
      if (!Object.keys(activeConnections).length) {
        log('There is no idle connections');
        return callback();
      }

      log(`Starting idle connection timeout ${options.socket.idleTimeout}`);
      setTimeout(() => {
        Object.keys(activeConnections).forEach((key) => {
          const settings = activeConnections[key];
          if (!settings) {
            return;
          }

          log(`Destroying connection: ${key}`);
          settings.connection.destroy();
        });

        log('All connections destroyed');
        callback();
      }, options.socket.idleTimeout);
    });

    // destroy connections without requests
    this._destroyUnusedConnections();

    return this;
  }

  _prepareErrorHandler() {
    const app = this.expressApp;

    app.use(expressDomainMiddleware);
  }

  _prepareCompression() {
    const app = this.expressApp;
    const options = this.options;

    if (!options.compression) {
      return;
    }

    app.use(compression(options.compression));
  }

  _prepareLog() {
    const app = this.expressApp;
    const options = this.options;

    if (!options.log) {
      return;
    }

    app.set('showStackError', true);

    if (!options.morgan) {
      return;
    }
    app.use(morgan(options.morgan.format, options.morgan.options));
  }

  _prepareEngine() {
    const app = this.expressApp;
    const options = this.options;

    app.locals.pretty = true;
    app.locals.cache = 'memory';
    app.enable('jsonp callback');

    app.engine('html', consolidate[options.view.engine]);

    app.set('view engine', 'html');
    app.set('views', `${options.root}/views`);
  }

  _prepareHtml() {
    const app = this.expressApp;
    const options = this.options;

    if (!options.powered) {
      app.disable('x-powered-by');
    }

    if (options.responseTime) {
      app.use(responseTime(options.responseTime));
    }

    if (options.cors) {
      app.use(cors(options.cors));
    }

    if (options.request.timeout) {
      app.use(timeout(options.request.timeout));
    }

    if (options.cookieParser) {
      app.use(cookieParser(options.cookieParser.secret, options.cookieParser.options));
    }

    if (options.bodyParser) {
      for (let index = 0; index < options.bodyParser.length; index++) {
        const bp = options.bodyParser[index];
        app.use(bodyParser[bp.parse](bp.options));
      }
    }

    if (options.methodOverride) {
      app.use(methodOverride(options.methodOverride.getter, options.methodOverride.options));
    }
  }

  _prepareVars() {
    const app = this.expressApp;
    const server = this.server;
    const options = this.options;

    // add access to req from template
    app.use(function setTemplateVariables(req, res, next) {
      res.locals._req = req;
      res.locals._production = process.env.NODE_ENV === 'production';
      res.locals._build = options.server.build;

      next();
    });

    // add access to req from template
    app.use(function setBasicVariables(req, res, next) {
      req.objects = {};
      req.server = server;
      req.models = server.models;

      next();
    });
  }

  _prepareSession() {
    const app = this.expressApp;
    const options = this.options;

    if (!options.session) {
      return;
    }

    // use session middleware
    const sessionMiddleware = session(options.session);
    app.use(sessionMiddleware);

    if (!options.sessionRecovery) {
      return;
    }

    // session recovery
    app.use(function sessionRecovery(req, res, next) {
      let tries = options.sessionRecovery.tries;

      function lookupSession(error) {
        if (error) {
          return next(error);
        }

        if (typeof req.session !== 'undefined') {
          return next();
        }

        tries -= 1;

        if (tries < 0) {
          return next(new Error('Session is undefined'));
        }

        sessionMiddleware(req, res, lookupSession);
      }

      lookupSession();
    });
  }

  _prepareSecure() {
    const app = this.expressApp;
    const server = this.server;
    const options = this.options;

    app.use(server.secure.passport.initialize());

    if (options.session) {
      app.use(server.secure.passport.session());
    }
  }

  _prepareStatic() {
    const app = this.expressApp;
    const options = this.options;

    if (options.flash) {
      app.use(flash());
    }

    try {
      if (options.favicon) {
        log(`FavIcon root: ${options.favicon.root}`);
        app.use(serveFavicon(options.favicon.root, options.favicon.options));
      }

      if (options.robots) {
        log(`Robots root: ${options.robots.root}`);
        app.use(robots(options.robots.root));
      }
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err;
      }

      log(err.message);
    }

    if (options.css) {
      log(`CSS root: ${options.css.root}`);
      app.use(options.css.path, lessMiddleware(options.css.root, options.css.options));
    }

    if (options.static) {
      if (!options.static.path || !options.static.root) {
        throw new Error('Static path or root is undefined');
      }

      log(`Static root: ${options.static.root}`);
      app.use(options.static.path, serveStatic(options.static.root, options.static.options));
    }
  }

  _prepareRouter() {
    const app = this.expressApp;
    const options = this.options;
    const server = this.server;

    // use server router
    app.use(server.router.expressRouter);

    // delete uploaded files
    app.use(fileController.clearAfterError); // error must be first
    app.use(fileController.clear);

    // at the end add 500 and 404
    app.use(options.page.notFound || pageController.notFound);
    app.use(options.page.error || pageController.error);
  }

  _prepareMiddleware(type) {
    const app = this.expressApp;
    const options = this.options;
    const middlewares = options.middleware;

    if (!middlewares || !middlewares[type]) {
      return;
    }

    const middleware = middlewares[type];

    if (typeof middleware === 'function') {
      app.use(middleware);
    } else if (isArray(middleware)) {
      middleware.forEach((fn) => {
        app.use(fn);
      });
    }
  }
}

function prepareRequest(req) {
  req.__defineGetter__('httpHost', function getHttpHost() {
    const trustProxy = this.app.get('trust proxy');
    const host = trustProxy && this.get('X-Forwarded-Host');

    return host || this.get('Host');
  });

  req.__defineGetter__('port', function getPort() {
    const host = this.httpHost;
    if (!host) {
      return null;
    }

    const parts = host.split(':');
    return (parts.length === 2) ? parseInt(parts[1], 10) : 80;
  });

  req.__defineGetter__('protocolHost', function getProtocolHost() {
    return `${this.protocol}://${this.httpHost}`;
  });
}

prepareRequest(request);
