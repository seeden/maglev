'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.generateForCurrent = generateForCurrent;
exports.generate = generate;
exports.invalidate = invalidate;
exports.ensure = ensure;
exports.ensureWithSession = ensureWithSession;
exports.tryEnsure = tryEnsure;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _webError = require('web-error');

var _webError2 = _interopRequireDefault(_webError);

var _okay = require('okay');

var _okay2 = _interopRequireDefault(_okay);

function generateForCurrent(req, res, next) {
  var user = req.user;
  var options = req.server.options;

  if (!user) {
    return next(new _webError2['default'](401));
  }

  res.jsonp({
    token: user.generateBearerToken(options.token.secret, options.token.expiration),
    user: user.toPrivateJSON()
  });
}

function generate(req, res, next) {
  var User = req.models.User;
  var options = req.server.options;

  if (!req.body.username || !req.body.password) {
    return next(new _webError2['default'](400, 'One of parameter missing'));
  }

  User.findByUsernamePassword(req.body.username, req.body.password, false, (0, _okay2['default'])(next, function (user) {
    if (!user) {
      return next(new _webError2['default'](404, 'Invalid username or password'));
    }

    res.jsonp({
      token: user.generateBearerToken(options.token.secret, options.token.expiration),
      user: user.toPrivateJSON()
    });
  }));
}

function invalidate(req, res, next) {
  if (!req.body.access_token) {
    return next(new _webError2['default'](400, 'Token is missing'));
  }

  // TODO remove from keystore db and invalidate token
  return res.status(501).jsonp({});
}

function ensure(req, res, next) {
  req.server.secure.authenticate('bearer', {
    session: false
  })(req, res, next);
}

function ensureWithSession(req, res, next) {
  if (req.isAuthenticated() === true) {
    return next(); // already authenticated via session cookie
  }

  req.server.secure.authenticate('bearer', {
    session: false
  })(req, res, next);
}

function tryEnsure(req, res, next) {
  req.server.secure.authenticate(['bearer', 'anonymous'], {
    session: false
  })(req, res, next);
}