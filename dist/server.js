"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var fs = _interopRequire(require("fs"));

var RBAC = _interopRequire(require("rbac"));

var extend = _interopRequire(require("node.extend"));

var defaultOptions = _interopRequire(require("./options"));

var Router = _interopRequire(require("./router"));

var App = _interopRequire(require("./app"));

var Secure = _interopRequire(require("./secure"));

var Models = _interopRequire(require("./models"));

var debug = _interopRequire(require("debug"));

var log = debug("maglev:server");

var Server = (function () {
	function Server(options, callback) {
		var _this = this;

		_classCallCheck(this, Server);

		options = extend(true, {}, defaultOptions, options);

		if (!options.db) {
			throw new Error("Db is not defined");
		}

		this._options = options;
		this._db = options.db;

		callback = callback || function () {};

		this._rbac = new RBAC(options.rbac.options, function (err) {
			if (err) {
				return callback(err);
			}

			callback(null, _this);
		});

		this._router = new Router(options.router); //router is used in app
		this._models = new Models(this, options.models); //models is used in secure
		this._secure = new Secure(this);

		this._app = new App(this, options);

		this._loadModels();
		this._loadRoutes();
	}

	_createClass(Server, {
		options: {
			get: function () {
				return this._options;
			}
		},
		rbac: {
			get: function () {
				return this._rbac;
			}
		},
		db: {
			get: function () {
				return this._db;
			}
		},
		secure: {
			get: function () {
				return this._secure;
			}
		},
		app: {
			get: function () {
				return this._app;
			}
		},
		router: {
			get: function () {
				return this._router;
			}
		},
		models: {
			get: function () {
				return this._models;
			}
		},
		listen: {
			value: function listen(callback) {
				var options = this.options;
				this.app.listen(options.server.port, options.server.host, callback);
				return this;
			}
		},
		close: {
			value: function close(callback) {
				this.app.close(callback);
				return this;
			}
		},
		_loadModels: {
			value: function _loadModels() {
				var server = this;
				var models = this._models;
				var path = this.options.root + "/models";

				Server.walk(path, function (model, modelPath) {
					try {
						models.register(model);
					} catch (e) {
						log("problem with model: " + modelPath);
						throw e;
					}
				});
			}
		},
		_loadRoutes: {
			value: function _loadRoutes() {
				var router = this.router;
				var path = this.options.root + "/routes";

				Server.walk(path, function (route, routePath) {
					try {
						route(router);
					} catch (e) {
						log("problem with route: " + routePath);
						throw e;
					}
				});
			}
		}
	}, {
		walk: {
			value: function walk(path, callback) {
				if (!fs.existsSync(path)) {
					log("Path does not exists: " + path);
					return;
				}

				fs.readdirSync(path).forEach(function (file) {
					var newPath = path + "/" + file;
					var stat = fs.statSync(newPath);

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
		}
	});

	return Server;
})();

module.exports = Server;