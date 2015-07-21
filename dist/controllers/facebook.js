'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.ensure = ensure;
exports.ensureCallback = ensureCallback;
exports.ensureCanvas = ensureCanvas;
exports.redirectToEnsure = redirectToEnsure;
exports.channel = channel;
exports.ensureBySignedRequest = ensureBySignedRequest;
exports.redirectPeopleToCanvas = redirectPeopleToCanvas;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _fb = require('fb');

var _fb2 = _interopRequireDefault(_fb);

var _webError = require('web-error');

var _webError2 = _interopRequireDefault(_webError);

var _okay = require('okay');

var _okay2 = _interopRequireDefault(_okay);

var fbScope = ['email', 'publish_actions'];
var fbSuccessRedirect = '/';
var fbFailureRedirect = '/?fb_error=signin';
var fbAuthUrl = '/auth/facebook';
var fbCallbackUrl = '/auth/facebook/callback';
var fbCanvasRedirectUrl = '/auth/facebook/autologin';

function ensure(req, res, next) {
  req.server.secure.authenticate('facebook', {
    scope: fbScope,
    failureRedirect: fbFailureRedirect,
    callbackURL: req.protocolHost + fbCallbackUrl
  })(req, res, next);
}

function ensureCallback(req, res, next) {
  req.server.secure.authenticate('facebook', {
    successRedirect: fbSuccessRedirect,
    failureRedirect: fbFailureRedirect,
    callbackURL: req.protocolHost + fbCallbackUrl
  })(req, res, next);
}

function ensureCanvas(req, res, next) {
  req.server.secure.authenticate('facebook-canvas', {
    scope: fbScope,
    successRedirect: fbSuccessRedirect,
    failureRedirect: fbCanvasRedirectUrl,
    callbackURL: req.protocolHost + fbCallbackUrl
  })(req, res, next);
}

/**
 * Redirect unauthorized facebook canvas application to the facebook ensure page
 * @param  {Request} req
 * @param  {Response} res
 */

function redirectToEnsure(req, res) {
  res.send('<!DOCTYPE html>\n    <body>\n    <script type="text/javascript">\n      top.location.href = "' + fbAuthUrl + '";\n    </script>\n    </body>\n  </html>');
}

/**
 * Channel for facebook API
 */

function channel(req, res) {
  var oneYear = 31536000;
  res.set({
    Pragma: 'public',
    'Cache-Control': 'max-age=' + oneYear,
    Expires: new Date(Date.now() + oneYear * 1000).toUTCString()
  });

  res.send('<script src="//connect.facebook.net/en_US/all.js"></script>');
}

function ensureBySignedRequest(req, res, next) {
  if (!req.body.signedRequest || !req.body.profile) {
    return next(new _webError2['default'](400));
  }

  var User = req.models.User;
  var options = req.server.options;
  var profile = req.body.profile;

  var session = req.body.session || false;
  var signedRequest = _fb2['default'].parseSignedRequest(req.body.signedRequest, options.facebook.appSecret);

  if (!signedRequest) {
    return next(new _webError2['default'](400, 'Parsing signed request'));
  }

  if (!signedRequest.user_id) {
    return next(new _webError2['default'](400, 'User ID is missing'));
  }

  // if user is authentificated and ids is same
  if (req.user && req.user.facebook.id === signedRequest.user_id) {
    return next();
  }

  // search user in database
  User.findByFacebookID(signedRequest.user_id, (0, _okay2['default'])(next, function (user) {
    if (user) {
      return req.logIn(user, { session: session }, next);
    }

    if (!options.registration.simple) {
      return next(new _webError2['default'](400, 'User needs to be registered'));
    }

    if (profile.id !== signedRequest.user_id) {
      return next(new _webError2['default'](400, 'Profile.id is different from signedRequest.user_id'));
    }

    User.createByFacebook(profile, (0, _okay2['default'])(next, function (createdUser) {
      req.logIn(createdUser, { session: session }, next);
    }));
  }));
}

function redirectPeopleToCanvas(req, res, next) {
  var facebookBot = 'facebookexternalhit';
  var options = req.server.options;

  if (!req.headers['user-agent'] || req.headers['user-agent'].indexOf(facebookBot) === -1) {
    return res.redirect(302, 'https://apps.facebook.com/' + options.facebook.namespace + '/');
  }

  next();
}