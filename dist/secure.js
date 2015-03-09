"use strict";

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var passport = _interopRequire(require("passport"));

var strategy = _interopRequireWildcard(require("./strategy"));

var Secure = (function () {
	function Secure(server) {
		_classCallCheck(this, Secure);

		this._server = server;

		this._prepare();
	}

	_createClass(Secure, {
		server: {
			get: function () {
				return this._server;
			}
		},
		passport: {
			get: function () {
				return passport;
			}
		},
		_prepare: {
			value: function _prepare() {
				var server = this.server;
				var passport = this.passport;

				passport.serializeUser(function (user, done) {
					done(null, user.id);
				});

				passport.deserializeUser(function (id, done) {
					var User = server.models.User;

					User.findById(id, function (err, user) {
						done(err, user);
					});
				});

				var options = server.options;
				var models = server.models;

				passport.use(strategy.anonymous(options, models));
				passport.use(strategy.local(options, models));
				passport.use(strategy.bearer(options, models));

				options.strategies.forEach(function (strategy) {
					passport.use(strategy(options, models));
				});
			}
		},
		authenticate: {
			value: function authenticate() {
				for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
					args[_key] = arguments[_key];
				}

				var passport = this.passport;
				return passport.authenticate.apply(passport, args);
			}
		}
	});

	return Secure;
})();

module.exports = Secure;