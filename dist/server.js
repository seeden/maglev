'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _rbac = require('rbac');

var _rbac2 = _interopRequireDefault(_rbac);

var _nodeExtend = require('node.extend');

var _nodeExtend2 = _interopRequireDefault(_nodeExtend);

var _options = require('./options');

var _options2 = _interopRequireDefault(_options);

var _router = require('./router');

var _router2 = _interopRequireDefault(_router);

var _app = require('./app');

var _app2 = _interopRequireDefault(_app);

var _secure = require('./secure');

var _secure2 = _interopRequireDefault(_secure);

var _models = require('./models');

var _models2 = _interopRequireDefault(_models);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _memwatchNext = require('memwatch-next');

var _memwatchNext2 = _interopRequireDefault(_memwatchNext);

var _heapdump = require('heapdump');

var _heapdump2 = _interopRequireDefault(_heapdump);

var _domain = require('domain');

var _domain2 = _interopRequireDefault(_domain);

var _events = require('events');

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var log = (0, _debug2['default'])('maglev:server');
var portOffset = parseInt(process.env.NODE_APP_INSTANCE || 0, 10);

var Server = (function (_EventEmitter) {
  _inherits(Server, _EventEmitter);

  function Server(options, callback) {
    var _this = this;

    _classCallCheck(this, Server);

    _get(Object.getPrototypeOf(Server.prototype), 'constructor', this).call(this);

    if (!callback) {
      throw new Error('Please use callback for server');
    }

    options = (0, _nodeExtend2['default'])(true, {}, _options2['default'], options);

    if (!options.db) {
      throw new Error('Db is not defined');
    }

    this._options = options;
    this._db = options.db;

    this.catchErrors(function () {
      _this.init(options, callback);
    });
  }

  _createClass(Server, [{
    key: 'handleError',
    value: function handleError(e) {
      log(e);

      this.emit('err', e);

      this.closeGracefully();
    }
  }, {
    key: 'catchErrors',
    value: function catchErrors(callback) {
      var _this2 = this;

      var d = _domain2['default'].create();

      d.id = 'ServerDomain';
      d.on('error', function (e) {
        return _this2.handleError(e);
      });

      try {
        d.run(callback);
      } catch (e) {
        process.nextTick(function () {
          return _this2.handleError(e);
        });
      }
    }
  }, {
    key: 'init',
    value: function init(options, callback) {
      var _this3 = this;

      this.watchMemoryLeaks(options);

      // catch system termination
      var signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
      signals.forEach(function (signal) {
        process.on(signal, function () {
          return _this3.closeGracefully();
        });
      });

      // catch PM2 termination
      process.on('message', function (msg) {
        if (msg === 'shutdown') {
          _this3.closeGracefully();
        }
      });

      this._rbac = new _rbac2['default'](options.rbac.options, function (err) {
        if (err) {
          return callback(err);
        }

        _this3._router = new _router2['default'](options.router); // router is used in app
        _this3._models = new _models2['default'](_this3, options.models); // models is used in secure
        _this3._secure = new _secure2['default'](_this3);

        _this3._app = new _app2['default'](_this3, options);

        _this3._loadRoutes();

        _this3._loadModels(function (err2) {
          if (err2) {
            return callback(err2);
          }

          callback(null, _this3);
        });
      });
    }
  }, {
    key: 'notifyPM2Online',
    value: function notifyPM2Online() {
      if (!process.send) {
        return;
      }

      // after callback
      process.nextTick(function notify() {
        process.send('online');
      });
    }
  }, {
    key: 'watchMemoryLeaks',
    value: function watchMemoryLeaks(options) {
      var _this4 = this;

      if (!options.memoryLeaks.watch) {
        return;
      }

      _memwatchNext2['default'].on('leak', function (info) {
        log('Memory leak detected: ', info);

        if (options.memoryLeaks.showHeap) {
          _this4.showHeapDiff();
        }

        if (options.memoryLeaks.path) {
          (function () {
            var file = options.memoryLeaks.path + '/' + process.pid + '-' + Date.now() + '.heapsnapshot';
            _heapdump2['default'].writeSnapshot(file, function writeSnapshotCallback(err) {
              if (err) {
                log(err);
              } else {
                log('Wrote snapshot: ' + file);
              }
            });
          })();
        }
      });
    }
  }, {
    key: 'showHeapDiff',
    value: function showHeapDiff() {
      if (!this.hd) {
        this.hd = new _memwatchNext2['default'].HeapDiff();
      } else {
        var diff = this.hd.end();
        log(_util2['default'].inspect(diff, true, null));
        this.hd = null;
      }
    }
  }, {
    key: 'listen',
    value: function listen(callback) {
      var _this5 = this;

      if (!callback) {
        throw new Error('Callback is undefined');
      }

      if (this._listening) {
        callback(new Error('Server is already listening'));
        return this;
      }

      this._listening = true;

      var options = this.options;
      this.app.listen(options.server.port + portOffset, options.server.host, function (err) {
        if (err) {
          return callback(err);
        }

        log('Server is listening on port: ' + _this5.app.httpServer.address().port);

        _this5.notifyPM2Online();

        callback(null, _this5);
      });

      return this;
    }
  }, {
    key: 'close',
    value: function close(callback) {
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
  }, {
    key: 'closeGracefully',
    value: function closeGracefully() {
      log('Received kill signal (SIGTERM), shutting down gracefully.');
      if (!this._listening) {
        log('Ended without any problem');
        process.exit(0);
        return;
      }

      var termTimeoutID = null;

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

      var options = this.options;
      termTimeoutID = setTimeout(function timeoutCallback() {
        termTimeoutID = null;
        log('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, options.shutdown.timeout);
    }
  }, {
    key: '_loadModels',
    value: function _loadModels(callback) {
      var models = this._models;
      var path = this.options.root + '/models';

      Server.walk(path, function processModel(model, modelPath) {
        try {
          models.register(model);
        } catch (e) {
          log('Problem with model: ' + modelPath);
          throw e;
        }
      });

      // preload all models
      models.preload(callback);
    }
  }, {
    key: '_loadRoutes',
    value: function _loadRoutes() {
      var router = this.router;
      var path = this.options.root + '/routes';

      Server.walk(path, function processPath(route, routePath) {
        try {
          route(router);
        } catch (e) {
          log('Problem with route: ' + routePath);
          throw e;
        }
      });
    }
  }, {
    key: 'options',
    get: function get() {
      return this._options;
    }
  }, {
    key: 'rbac',
    get: function get() {
      return this._rbac;
    }
  }, {
    key: 'db',
    get: function get() {
      return this._db;
    }
  }, {
    key: 'secure',
    get: function get() {
      return this._secure;
    }
  }, {
    key: 'app',
    get: function get() {
      return this._app;
    }
  }, {
    key: 'router',
    get: function get() {
      return this._router;
    }
  }, {
    key: 'models',
    get: function get() {
      return this._models;
    }
  }], [{
    key: 'walk',
    value: function walk(path, callback) {
      if (!_fs2['default'].existsSync(path)) {
        log('Path does not exists: ' + path);
        return;
      }

      _fs2['default'].readdirSync(path).forEach(function eachFile(file) {
        var newPath = path + '/' + file;
        var stat = _fs2['default'].statSync(newPath);

        if (stat.isFile()) {
          if (/(.*)\.(js$|coffee$)/.test(file)) {
            var model = require(newPath);
            callback(model, newPath, file);
          }
        } else if (stat.isDirectory()) {
          Server.walk(newPath, callback);
        }
      });
    }
  }]);

  return Server;
})(_events.EventEmitter);

exports['default'] = Server;
module.exports = exports['default'];