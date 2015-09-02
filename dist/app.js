'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _expressDomainMiddleware = require('express-domain-middleware');

var _expressDomainMiddleware2 = _interopRequireDefault(_expressDomainMiddleware);

var _compression = require('compression');

var _compression2 = _interopRequireDefault(_compression);

var _serveFavicon = require('serve-favicon');

var _serveFavicon2 = _interopRequireDefault(_serveFavicon);

var _serveStatic = require('serve-static');

var _serveStatic2 = _interopRequireDefault(_serveStatic);

var _cookieParser = require('cookie-parser');

var _cookieParser2 = _interopRequireDefault(_cookieParser);

var _expressSession = require('express-session');

var _expressSession2 = _interopRequireDefault(_expressSession);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _methodOverride = require('method-override');

var _methodOverride2 = _interopRequireDefault(_methodOverride);

var _responseTime = require('response-time');

var _responseTime2 = _interopRequireDefault(_responseTime);

var _connectTimeout = require('connect-timeout');

var _connectTimeout2 = _interopRequireDefault(_connectTimeout);

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _cors = require('cors');

var _cors2 = _interopRequireDefault(_cors);

var _lessMiddleware = require('less-middleware');

var _lessMiddleware2 = _interopRequireDefault(_lessMiddleware);

var _expressLibRequest = require('express/lib/request');

var _expressLibRequest2 = _interopRequireDefault(_expressLibRequest);

var _consolidate = require('consolidate');

var _consolidate2 = _interopRequireDefault(_consolidate);

var _connectFlash = require('connect-flash');

var _connectFlash2 = _interopRequireDefault(_connectFlash);

var _robotsTxt = require('robots.txt');

var _robotsTxt2 = _interopRequireDefault(_robotsTxt);

var _controllersFile = require('./controllers/file');

var fileController = _interopRequireWildcard(_controllersFile);

var _controllersPage = require('./controllers/page');

var pageController = _interopRequireWildcard(_controllersPage);

var log = (0, _debug2['default'])('maglev:app');

var App = (function () {
  function App(server) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, App);

    if (!options.root) {
      throw new Error('Root is undefined');
    }

    log('App root: ' + options.root);

    this._server = server;
    this._options = options;
    this._expressApp = (0, _express2['default'])();
    this._httpServer = null;
    this._activeConnections = {};

    // prepare basic
    this._prepareErrorHandler();
    this._prepareCompression();
    this._prepareLog();
    this._prepareEngine();
    this._prepareHtml();

    // prepare static
    this._prepareStatic();

    // prepare middlewares
    this._prepareVars();
    this._prepareSession();
    this._prepareSecure();
    this._prepareCustomMiddleware();
    this._prepareRouter();
  }

  _createClass(App, [{
    key: 'listen',
    value: function listen(port, host, callback) {
      if (this._httpServer) {
        return callback(new Error('You need to close first'));
      }

      this._httpServer = _http2['default'].createServer(this.expressApp).listen(port, host, callback);

      var activeConnections = this.activeConnections;
      var httpServer = this.httpServer;

      httpServer.on('connection', function (conn) {
        var key = conn.remoteAddress + ':' + conn.remotePort;
        activeConnections[key] = conn;

        conn.on('close', function connCloseCallback() {
          delete activeConnections[key];
        });
      });

      return this;
    }
  }, {
    key: 'close',
    value: function close(callback) {
      var _this = this;

      if (!this._httpServer) {
        return callback(new Error('You need to listen first'));
      }

      this._httpServer.close(function (err) {
        _this._httpServer = null;
        callback(err);
      });

      var activeConnections = this.activeConnections;
      var options = this.options;

      setTimeout(function () {
        Object.keys(activeConnections).forEach(function destroyConnection(key) {
          var conn = activeConnections[key];
          if (!conn) {
            return;
          }

          conn.destroy();
        });
      }, options.socket.idleTimeout);

      return this;
    }
  }, {
    key: '_prepareErrorHandler',
    value: function _prepareErrorHandler() {
      var app = this.expressApp;

      app.use(_expressDomainMiddleware2['default']);
    }
  }, {
    key: '_prepareCompression',
    value: function _prepareCompression() {
      var app = this.expressApp;
      var options = this.options;

      if (!options.compression) {
        return;
      }

      app.use((0, _compression2['default'])(options.compression));
    }
  }, {
    key: '_prepareLog',
    value: function _prepareLog() {
      var app = this.expressApp;
      var options = this.options;

      if (!options.log) {
        return;
      }

      app.set('showStackError', true);

      if (!options.morgan) {
        return;
      }
      app.use((0, _morgan2['default'])(options.morgan.format, options.morgan.options));
    }
  }, {
    key: '_prepareEngine',
    value: function _prepareEngine() {
      var app = this.expressApp;
      var options = this.options;

      app.locals.pretty = true;
      app.locals.cache = 'memory';
      app.enable('jsonp callback');

      app.engine('html', _consolidate2['default'][options.view.engine]);

      app.set('view engine', 'html');
      app.set('views', options.root + '/views');
    }
  }, {
    key: '_prepareHtml',
    value: function _prepareHtml() {
      var app = this.expressApp;
      var options = this.options;

      if (!options.powered) {
        app.disable('x-powered-by');
      }

      if (options.responseTime) {
        app.use((0, _responseTime2['default'])(options.responseTime));
      }

      if (options.cors) {
        app.use((0, _cors2['default'])(options.cors));
      }

      if (options.request.timeout) {
        app.use((0, _connectTimeout2['default'])(options.request.timeout));
      }

      if (options.cookieParser) {
        app.use((0, _cookieParser2['default'])(options.cookieParser.secret, options.cookieParser.options));
      }

      if (options.bodyParser) {
        for (var i = 0; i < options.bodyParser.length; i++) {
          var bp = options.bodyParser[i];
          app.use(_bodyParser2['default'][bp.parse](bp.options));
        }
      }

      if (options.methodOverride) {
        app.use((0, _methodOverride2['default'])(options.methodOverride.getter, options.methodOverride.options));
      }
    }
  }, {
    key: '_prepareVars',
    value: function _prepareVars() {
      var app = this.expressApp;
      var server = this.server;
      var options = this.options;

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
  }, {
    key: '_prepareSession',
    value: function _prepareSession() {
      var app = this.expressApp;
      var options = this.options;

      if (!options.session) {
        return;
      }

      // use session middleware
      var sessionMiddleware = (0, _expressSession2['default'])(options.session);
      app.use(sessionMiddleware);

      if (!options.sessionRecovery) {
        return;
      }

      // session recovery
      app.use(function sessionRecovery(req, res, next) {
        var tries = options.sessionRecovery.tries;

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
  }, {
    key: '_prepareSecure',
    value: function _prepareSecure() {
      var app = this.expressApp;
      var server = this.server;
      var options = this.options;

      app.use(server.secure.passport.initialize());

      if (options.session) {
        app.use(server.secure.passport.session());
      }
    }
  }, {
    key: '_prepareStatic',
    value: function _prepareStatic() {
      var app = this.expressApp;
      var options = this.options;

      if (options.flash) {
        app.use((0, _connectFlash2['default'])());
      }

      try {
        if (options.favicon && _fs2['default'].accessSync(options.favicon.root, _fs2['default'].R_OK)) {
          log('FavIcon root: ' + options.favicon.root);
          app.use((0, _serveFavicon2['default'])(options.favicon.root, options.favicon.options));
        }

        if (options.robots && _fs2['default'].accessSync(options.robots.root, _fs2['default'].R_OK)) {
          log('Robots root: ' + options.robots.root);
          app.use((0, _robotsTxt2['default'])(options.robots.root));
        }
      } catch (e) {
        if (e.code !== 'ENOENT') {
          throw e;
        }

        log(e.message);
      }

      if (options.css) {
        log('CSS root: ' + options.css.root);
        app.use(options.css.path, (0, _lessMiddleware2['default'])(options.css.root, options.css.options));
      }

      if (options['static']) {
        if (!options['static'].path || !options['static'].root) {
          throw new Error('Static path or root is undefined');
        }

        log('Static root: ' + options['static'].root);
        app.use(options['static'].path, (0, _serveStatic2['default'])(options['static'].root, options['static'].options));
      }
    }
  }, {
    key: '_prepareRouter',
    value: function _prepareRouter() {
      var app = this.expressApp;
      var options = this.options;
      var server = this.server;

      // use server router
      app.use(server.router.expressRouter);

      // delete uploaded files
      app.use(fileController.clearAfterError); // error must be first
      app.use(fileController.clear);

      // at the end add 500 and 404
      app.use(options.page.notFound || pageController.notFound);
      app.use(options.page.error || pageController.error);
    }
  }, {
    key: '_prepareCustomMiddleware',
    value: function _prepareCustomMiddleware() {
      var app = this.expressApp;
      var options = this.options;
      var middleware = options.middleware;

      if (!middleware) {
        return;
      }

      if (typeof middleware === 'function') {
        app.use(middleware);
      } else if (_underscore2['default'].isArray(middleware)) {
        middleware.forEach(function (fn) {
          app.use(fn);
        });
      }
    }
  }, {
    key: 'options',
    get: function get() {
      return this._options;
    }
  }, {
    key: 'activeConnections',
    get: function get() {
      return this._activeConnections;
    }
  }, {
    key: 'server',
    get: function get() {
      return this._server;
    }
  }, {
    key: 'httpServer',
    get: function get() {
      return this._httpServer;
    }
  }, {
    key: 'expressApp',
    get: function get() {
      return this._expressApp;
    }
  }]);

  return App;
})();

exports['default'] = App;

function prepareRequest(req) {
  req.__defineGetter__('httpHost', function getHttpHost() {
    var trustProxy = this.app.get('trust proxy');
    var host = trustProxy && this.get('X-Forwarded-Host');

    return host || this.get('Host');
  });

  req.__defineGetter__('port', function getPort() {
    var host = this.httpHost;
    if (!host) {
      return null;
    }

    var parts = host.split(':');
    return parts.length === 2 ? parseInt(parts[1], 10) : 80;
  });

  req.__defineGetter__('protocolHost', function getProtocolHost() {
    return this.protocol + '://' + this.httpHost;
  });
}

prepareRequest(_expressLibRequest2['default']);
module.exports = exports['default'];