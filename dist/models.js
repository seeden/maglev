'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _async = require('async');

var Models = (function () {
  function Models(server) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, Models);

    this._options = options;
    this._server = server;

    this._models = new Map();
    this._modelFactories = new Map();
  }

  _createClass(Models, [{
    key: '_createModelFromFactory',
    value: function _createModelFromFactory(name) {
      if (!this._modelFactories.has(name)) {
        throw new Error('Modul is not registered: ' + name);
      }

      var modelFactory = this._modelFactories.get(name);
      var config = {
        model: null,
        callbacks: []
      };

      if (typeof modelFactory !== 'function') {
        throw new Error('Model factory is not a function for model: ' + name);
      }

      config.model = modelFactory(this.server, function modelFactoryCallback(error) {
        config.loaded = true;
        config.error = error;

        config.callbacks.forEach(function eachCallback(callback) {
          callback(error, config.model);
        });

        config.callbacks = [];
      });

      this._models.set(name, config);
    }
  }, {
    key: 'model',
    value: function model(name, callback) {
      if (!this._models.has(name)) {
        this._createModelFromFactory(name);
      }

      var config = this._models.get(name);

      if (!callback) {
        return config.model;
      }

      // TODO replace it with async.memorize
      if (config.loaded) {
        callback(config.error, config.model);
      } else {
        config.callbacks.push(callback);
      }

      return config.model;
    }
  }, {
    key: 'register',
    value: function register(modelModul) {
      var name = modelModul.name;
      if (!name) {
        throw new Error('Model has no name');
      }

      this._modelFactories.set(name, modelModul['default'] ? modelModul['default'] : modelModul);

      Object.defineProperty(this, name, {
        get: function getProperty() {
          return this.model(name);
        }
      });
    }
  }, {
    key: 'preload',
    value: function preload(callback) {
      var _this = this;

      var keys = [];
      this._modelFactories.forEach(function eachModelFactory(factory, modelName) {
        keys.push(modelName);
      });

      (0, _async.each)(keys, function (modelName, cb) {
        return _this.model(modelName, cb);
      }, callback);
    }
  }, {
    key: 'options',
    get: function get() {
      return this._options;
    }
  }, {
    key: 'server',
    get: function get() {
      return this._server;
    }
  }]);

  return Models;
})();

exports['default'] = Models;
module.exports = exports['default'];