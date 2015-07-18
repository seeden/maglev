'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

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

var log = (0, _debug2['default'])('maglev:server');

var Server = (function () {
  function Server(options, callback) {
    var _this = this;

    _classCallCheck(this, Server);

    if (!callback) {
      throw new Error('Please use callback for server');
    }

    options = (0, _nodeExtend2['default'])(true, {}, _options2['default'], options);

    if (!options.db) {
      throw new Error('Db is not defined');
    }

    this._options = options;
    this._db = options.db;

    this._rbac = new _rbac2['default'](options.rbac.options, function (err) {
      if (err) {
        return callback(err);
      }

      _this._router = new _router2['default'](options.router); // router is used in app
      _this._models = new _models2['default'](_this, options.models); // models is used in secure
      _this._secure = new _secure2['default'](_this);

      _this._app = new _app2['default'](_this, options);

      _this._loadRoutes();

      _this._loadModels(function (err2) {
        if (err2) {
          return callback(err2);
        }

        callback(null, _this);
      });
    });
  }

  _createClass(Server, [{
    key: 'options',
    get: function () {
      return this._options;
    }
  }, {
    key: 'rbac',
    get: function () {
      return this._rbac;
    }
  }, {
    key: 'db',
    get: function () {
      return this._db;
    }
  }, {
    key: 'secure',
    get: function () {
      return this._secure;
    }
  }, {
    key: 'app',
    get: function () {
      return this._app;
    }
  }, {
    key: 'router',
    get: function () {
      return this._router;
    }
  }, {
    key: 'models',
    get: function () {
      return this._models;
    }
  }, {
    key: 'listen',
    value: function listen(callback) {
      var options = this.options;
      this.app.listen(options.server.port, options.server.host, callback);
      return this;
    }
  }, {
    key: 'close',
    value: function close(callback) {
      this.app.close(callback);
      return this;
    }
  }, {
    key: '_loadModels',
    value: function _loadModels(callback) {
      var models = this._models;
      var path = this.options.root + '/models';

      Server.walk(path, function (model, modelPath) {
        try {
          models.register(model);
        } catch (e) {
          log('problem with model: ' + modelPath);
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

      Server.walk(path, function (route, routePath) {
        try {
          route(router);
        } catch (e) {
          log('problem with route: ' + routePath);
          throw e;
        }
      });
    }
  }], [{
    key: 'walk',
    value: function walk(path, callback) {
      if (!_fs2['default'].existsSync(path)) {
        log('Path does not exists: ' + path);
        return;
      }

      _fs2['default'].readdirSync(path).forEach(function (file) {
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
})();

exports['default'] = Server;
module.exports = exports['default'];