"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var methods = _interopRequire(require("methods"));

var express = _interopRequire(require("express"));

var Router = (function () {
	function Router(options, parent) {
		_classCallCheck(this, Router);

		options = options || {};

		this._options = options;
		this._expressRouter = express.Router(options);
		this._parent = parent || null;
	}

	_createClass(Router, {
		parent: {
			get: function () {
				return this._parent;
			}
		},
		expressRouter: {
			get: function () {
				return this._expressRouter;
			}
		},
		end: {
			value: function end() {
				return this.parent;
			}
		},
		route: {
			value: function route(prefix) {
				var router = new Router(this._options, this);
				this.expressRouter.use(prefix, router.expressRouter);
				return router;
			}
		},
		api: {
			value: function api(prefix) {
				prefix = prefix || this._options.api.path;
				return this.route(prefix);
			}
		},
		param: {
			value: function param() {
				for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
					args[_key] = arguments[_key];
				}

				this.expressRouter.param.apply(this.expressRouter, args);
				return this;
			}
		}
	});

	return Router;
})();

module.exports = Router;

methods.forEach(function (method) {
	Router.prototype[method] = function () {
		for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
			args[_key] = arguments[_key];
		}

		var expressRouter = this.expressRouter;
		expressRouter[method].apply(expressRouter, args);
		return this;
	};
});