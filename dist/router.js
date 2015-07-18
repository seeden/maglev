'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _methods = require('methods');

var _methods2 = _interopRequireDefault(_methods);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var Router = (function () {
  function Router() {
    var options = arguments[0] === undefined ? {} : arguments[0];
    var parent = arguments[1] === undefined ? null : arguments[1];

    _classCallCheck(this, Router);

    this._options = options;
    this._expressRouter = _express2['default'].Router(options);
    this._parent = parent;
  }

  _createClass(Router, [{
    key: 'parent',
    get: function () {
      return this._parent;
    }
  }, {
    key: 'expressRouter',
    get: function () {
      return this._expressRouter;
    }
  }, {
    key: 'end',
    value: function end() {
      return this.parent;
    }
  }, {
    key: 'route',
    value: function route(prefix) {
      var router = new Router(this._options, this);
      this.expressRouter.use(prefix, router.expressRouter);
      return router;
    }
  }, {
    key: 'api',
    value: function api(prefix) {
      prefix = prefix || this._options.api.path;
      return this.route(prefix);
    }
  }, {
    key: 'param',
    value: function param() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      this.expressRouter.param.apply(this.expressRouter, args);
      return this;
    }
  }]);

  return Router;
})();

exports['default'] = Router;

_methods2['default'].forEach(function (method) {
  Router.prototype[method] = function () {
    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    var expressRouter = this.expressRouter;
    expressRouter[method].apply(expressRouter, args);
    return this;
  };
});
module.exports = exports['default'];