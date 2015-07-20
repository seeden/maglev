'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _strategy = require('./strategy');

var strategy = _interopRequireWildcard(_strategy);

var Secure = (function () {
  function Secure(server) {
    _classCallCheck(this, Secure);

    this._server = server;

    this._prepare();
  }

  _createClass(Secure, [{
    key: '_prepare',
    value: function _prepare() {
      var server = this.server;
      var pp = this.passport;

      pp.serializeUser(function (user, done) {
        done(null, user.id);
      });

      pp.deserializeUser(function (id, done) {
        var User = server.models.User;

        User.findById(id, function (err, user) {
          done(err, user);
        });
      });

      var options = server.options;
      var models = server.models;

      pp.use(strategy.anonymous(options, models));
      pp.use(strategy.local(options, models));
      pp.use(strategy.bearer(options, models));

      options.strategies.forEach(function (strategy2) {
        pp.use(strategy2(options, models));
      });
    }
  }, {
    key: 'authenticate',
    value: function authenticate() {
      var pp = this.passport;

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return pp.authenticate.apply(pp, args);
    }
  }, {
    key: 'server',
    get: function get() {
      return this._server;
    }
  }, {
    key: 'passport',
    get: function get() {
      return _passport2['default'];
    }
  }]);

  return Secure;
})();

exports['default'] = Secure;
module.exports = exports['default'];