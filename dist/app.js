"use strict";

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var express = _interopRequire(require("express"));

var debug = _interopRequire(require("debug"));

var http = _interopRequire(require("http"));

var compression = _interopRequire(require("compression"));

var serveFavicon = _interopRequire(require("serve-favicon"));

var serveStatic = _interopRequire(require("serve-static"));

var cookieParser = _interopRequire(require("cookie-parser"));

var session = _interopRequire(require("express-session"));

var bodyParser = _interopRequire(require("body-parser"));

var methodOverride = _interopRequire(require("method-override"));

var responseTime = _interopRequire(require("response-time"));

var timeout = _interopRequire(require("connect-timeout"));

var morgan = _interopRequire(require("morgan"));

var cors = _interopRequire(require("cors"));

var lessMiddleware = _interopRequire(require("less-middleware"));

var req = _interopRequire(require("express/lib/request"));

var consolidate = _interopRequire(require("consolidate"));

var flash = _interopRequire(require("connect-flash"));

var fileController = _interopRequireWildcard(require("./controllers/file"));

var pageController = _interopRequireWildcard(require("./controllers/page"));

var log = debug("maglev:app");

var App = (function () {
	function App(server, options) {
		_classCallCheck(this, App);

		options = options || {};

		this._server = server;
		this._options = options;
		this._expressApp = express();
		this._httpServer = null;

		this._prepareCompression();
		this._prepareLog();
		this._prepareEngine();
		this._prepareHtml();
		this._prepareVars();
		this._prepareSession();
		this._prepareSecure();
		this._prepareStatic();
		this._prepareRouter();
	}

	_createClass(App, {
		options: {
			get: function () {
				return this._options;
			}
		},
		server: {
			get: function () {
				return this._server;
			}
		},
		expressApp: {
			get: function () {
				return this._expressApp;
			}
		},
		listen: {
			value: function listen(port, host, callback) {
				callback = callback || function () {};

				if (this._httpServer) {
					return callback(new Error("You need to close first"));
				}

				this._httpServer = http.createServer(this.expressApp).listen(port, host, callback);

				log("App started on port " + port + " and host " + host);
				return this;
			}
		},
		close: {
			value: function close(callback) {
				if (!this._httpServer) {
					return callback(new Error("You need to listen first"));
				}

				this._httpServer.close(callback);
				this._httpServer = null;
				return this;
			}
		},
		_prepareCompression: {
			value: function _prepareCompression() {
				var app = this.expressApp;
				var options = this.options;

				if (!options.compression) {
					return;
				}

				app.use(compression(options.compression));
			}
		},
		_prepareLog: {
			value: function _prepareLog(server) {
				var app = this.expressApp;
				var options = this.options;

				if (!options.log) {
					return;
				}

				app.set("showStackError", true);

				if (!options.morgan) {
					return;
				}
				app.use(morgan(options.morgan.format, options.morgan.options));
			}
		},
		_prepareEngine: {
			value: function _prepareEngine() {
				var app = this.expressApp;
				var options = this.options;

				app.locals.pretty = true;
				app.locals.cache = "memory";
				app.enable("jsonp callback");

				app.engine("html", consolidate[options.view.engine]);

				app.set("view engine", "html");
				app.set("views", options.root + "/views");
			}
		},
		_prepareHtml: {
			value: function _prepareHtml() {
				var app = this.expressApp;
				var options = this.options;

				if (!options.powered) {
					app.disable("x-powered-by");
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
					for (var i = 0; i < options.bodyParser.length; i++) {
						var bp = options.bodyParser[i];
						app.use(bodyParser[bp.parse](bp.options));
					}
				}

				if (options.methodOverride) {
					app.use(methodOverride(options.methodOverride.getter, options.methodOverride.options));
				}
			}
		},
		_prepareVars: {
			value: function _prepareVars() {
				var app = this.expressApp;
				var server = this.server;
				var options = this.options;

				//add access to req from template
				app.use(function (req, res, next) {
					res.locals._req = req;
					res.locals._production = process.env.NODE_ENV === "production";
					res.locals._build = options.server.build;

					next();
				});

				//add access to req from template
				app.use(function (req, res, next) {
					req.objects = {};
					req.server = server;
					req.models = server.models;

					next();
				});
			}
		},
		_prepareSession: {
			value: function _prepareSession() {
				var app = this.expressApp;
				var options = this.options;

				if (!options.session) {
					return;
				}

				app.use(session(options.session));
			}
		},
		_prepareSecure: {
			value: function _prepareSecure() {
				var app = this.expressApp;
				var server = this.server;
				var options = this.options;

				app.use(server.secure.passport.initialize());

				if (!options.session) {
					return;
				}

				app.use(server.secure.passport.session());
			}
		},
		_prepareStatic: {
			value: function _prepareStatic() {
				var app = this.expressApp;
				var options = this.options;

				if (options.flash) {
					app.use(flash());
				}

				if (options.favicon) {
					app.use(serveFavicon(options.favicon.root, options.favicon.options));
				}

				if (options.css) {
					app.use(lessMiddleware(options.css.root, options.css.options));
				}

				if (options["static"]) {
					app.use(serveStatic(options["static"].root, options["static"].options));
				}
			}
		},
		_prepareRouter: {
			value: function _prepareRouter() {
				var app = this.expressApp;
				var options = this.options;
				var server = this.server;

				//use server router
				app.use(server.router.expressRouter);

				//delete uploaded files
				app.use(fileController.clearAfterError); //error must be first
				app.use(fileController.clear);

				//at the end add 500 and 404
				app.use(options.page.notFound || pageController.notFound);
				app.use(options.page.error || pageController.error);
			}
		}
	});

	return App;
})();

module.exports = App;

function prepareRequest(req) {
	req.__defineGetter__("httpHost", function () {
		var trustProxy = this.app.get("trust proxy");
		var host = trustProxy && this.get("X-Forwarded-Host");
		return host || this.get("Host");
	});

	req.__defineGetter__("port", function () {
		host = this.httpHost;
		if (!host) {
			return;
		}

		var parts = host.split(":");
		return parts.length === 2 ? parseInt(parts[1], 10) : 80;
	});

	req.__defineGetter__("protocolHost", function () {
		return this.protocol + "://" + this.httpHost;
	});

	req.isGuest = function () {
		return typeof this.user === "undefined";
	};

	req.can = function (action, resource, cb) {
		var server = this.server;
		var config = server.config;
		var rbac = server.rbac;

		//process guest
		if (this.isGuest()) {
			rbac.can(config.rbac.role.guest, action, resource, cb);
		} else {
			this.user.can(rbac, action, resource, cb);
		}
	};

	req.hasRole = function (name, cb) {
		var server = this.server;
		var rbac = server.rbac;

		if (this.isGuest()) {
			return cb(null, false);
		}

		this.user.hasRole(rbac, name, cb);
	};
}

prepareRequest(req);