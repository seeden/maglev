import fs from 'fs';
import RBAC from 'rbac';
import extend from 'node.extend';
import defaultOptions from './options';
import Router from './router';
import App from './app';
import Secure from './secure';
import Models from './models';
import debug from 'debug';
import domain from 'domain';
import { EventEmitter } from 'events';
import ok from 'okay';
import { each } from 'async';

const log = debug('maglev:server');
const portOffset = parseInt(process.env.NODE_APP_INSTANCE || 0, 10);

function walk(path, fileCallback, callback) {
  fs.readdir(path, ok(callback, (files) => {
    each(files, (file, cb) => {
      const newPath = path + '/' + file;
      fs.stat(newPath, ok(cb, (stat) => {
        if (stat.isFile()) {
          if (/(.*)\.(js$|coffee$)/.test(file)) {
            const model = require(newPath);
            return fileCallback(model, newPath, file, cb);
          }
        } else if (stat.isDirectory()) {
          return walk(newPath, fileCallback, cb);
        }

        cb();
      }));
    }, callback);
  }));
}

export default class Server extends EventEmitter {
  constructor(options, callback) {
    super();

    if (!callback) {
      throw new Error('Please use callback for server');
    }

    options = extend(true, {}, defaultOptions, options);

    if (!options.db) {
      throw new Error('Db is not defined');
    }

    this._options = options;
    this._db = options.db;

    this.catchErrors(() => {
      this.init(options, callback);
    });
  }

  handleError(err) {
    log(err);

    this.emit('err', err);

    this.closeGracefully();
  }

  catchErrors(callback) {
    const dom = domain.create();

    dom.id = 'ServerDomain';
    dom.on('error', (err) => this.handleError(err));

    try {
      dom.run(callback);
    } catch (err) {
      process.nextTick(() => this.handleError(err));
    }
  }

  init(options, callback) {
    // catch system termination
    const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
    signals.forEach((signal) => {
      process.on(signal, () => this.closeGracefully());
    });

    // catch PM2 termination
    process.on('message', (msg) => {
      if (msg === 'shutdown') {
        this.closeGracefully();
      }
    });

    this._rbac = new RBAC(options.rbac.options, ok(callback, () => {
      this._router = new Router(options.router); // router is used in app
      this._models = new Models(this, options.models); // models is used in secure
      this._secure = new Secure(this);

      this._app = new App(this, options);

      this._loadRoutes(ok(callback, () => {
        this._loadModels(ok(callback, () => {
          callback(null, this);
        }));
      }));
    }));
  }

  notifyPM2Online() {
    if (!process.send) {
      return;
    }

    // after callback
    process.nextTick(function notify() {
      process.send('online');
    });
  }

  get options() {
    return this._options;
  }

  get rbac() {
    return this._rbac;
  }

  get db() {
    return this._db;
  }

  get secure() {
    return this._secure;
  }

  get app() {
    return this._app;
  }

  get router() {
    return this._router;
  }

  get models() {
    return this._models;
  }

  listen(callback) {
    if (!callback) {
      throw new Error('Callback is undefined');
    }

    if (this._listening) {
      callback(new Error('Server is already listening'));
      return this;
    }

    this._listening = true;

    const options = this.options;
    this.app.listen(options.server.port + portOffset, options.server.host, ok(callback, () => {
      log(`Server is listening on port: ${this.app.httpServer.address().port}`);

      this.notifyPM2Online();

      callback(null, this);
    }));

    return this;
  }

  close(callback) {
    if (!callback) {
      throw new Error('Callback is undefined');
    }

    if (!this._listening) {
      callback(new Error('Server is not listening'));
      return this;
    }

    this._listening = false;

    this.app.close(callback);

    return this;
  }

  closeGracefully() {
    log('Received kill signal (SIGTERM), shutting down gracefully.');
    if (!this._listening) {
      log('Ended without any problem');
      process.exit(0);
      return;
    }

    let termTimeoutID = null;

    this.close(function closeCallback(err) {
      if (termTimeoutID) {
        clearTimeout(termTimeoutID);
        termTimeoutID = null;
      }

      if (err) {
        log(err.message);
        process.exit(1);
        return;
      }

      log('Ended without any problem');
      process.exit(0);
    });

    const options = this.options;
    termTimeoutID = setTimeout(function timeoutCallback() {
      termTimeoutID = null;
      log('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, options.shutdown.timeout);
  }

  _loadModels(callback) {
    const models = this._models;
    const path = this.options.root + '/models';

    walk(path, (model, modelPath, file, cb) => {
      try {
        log(`Loading model: ${modelPath}`);
        models.register(model);
        cb();
      } catch (err) {
        log(`Problem with model: ${modelPath}`);
        cb(err);
      }
    }, ok(callback, () => {
      // preload all models
      models.preload(callback);
    }));
  }

  _loadRoutes(callback) {
    const router = this.router;
    const path = this.options.root + '/routes';

    walk(path, (route, routePath, file, cb) => {
      try {
        log(`Loading route: ${routePath}`);
        const routeFn = route.default ? route.default : route;
        routeFn(router);
        cb();
      } catch (err) {
        log(`Problem with route: ${routePath}`);
        cb(err);
      }
    }, callback);
  }
}
