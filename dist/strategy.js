'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.anonymous = anonymous;
exports.local = local;
exports.bearer = bearer;
exports.facebook = facebook;
exports.twitter = twitter;
exports.facebookCanvas = facebookCanvas;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _passportLocal = require('passport-local');

var _passportHttpBearer = require('passport-http-bearer');

var _passportAnonymous = require('passport-anonymous');

var _passportFacebook = require('passport-facebook');

var _passportTwitter = require('passport-twitter');

var _passportFacebookCanvas = require('passport-facebook-canvas');

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _webError = require('web-error');

var _webError2 = _interopRequireDefault(_webError);

function anonymous() {
  return new _passportAnonymous.Strategy();
}

function local(options, models) {
  // Use local strategy TODO find by object
  return new _passportLocal.Strategy({
    usernameField: 'username',
    passwordField: 'password'
  }, function (email, password, done) {
    var User = models.User;

    User.findOne({
      email: email
    }, function (err, user) {
      if (err) {
        return done(err);
      }

      if (!user) {
        return done(null, false, {
          message: 'Unknown user'
        });
      }

      if (!user.authenticate(password)) {
        return done(null, false, {
          message: 'Invalid password'
        });
      }

      return done(null, user);
    });
  });
}

function bearer(options, models) {
  return new _passportHttpBearer.Strategy(function (token, done) {
    var User = models.User;

    if (!token) {
      return done(new _webError2['default'](401, 'Invalid token'));
    }

    _jsonwebtoken2['default'].verify(token, options.token.secret, function (err, data) {
      if (err) {
        return done(new _webError2['default'](401, err.message));
      }

      if (!data.user) {
        return done(new _webError2['default'](404, 'Unknown user'));
      }

      User.findById(data.user, function (err2, user) {
        if (err2) {
          return done(err2);
        }

        if (!user) {
          return done(new _webError2['default'](404, 'Unknown user'));
        }

        return done(null, user);
      });
    });
  });
}

function facebook(options, models) {
  return new _passportFacebook.Strategy({
    clientID: options.facebook.appID,
    clientSecret: options.facebook.appSecret
  }, function (accessToken, refreshToken, profile, done) {
    var User = models.User;

    if (!profile.id) {
      return done(new Error('Profile ID is null'));
    }

    if (!options.facebook.appID || !options.facebook.appSecret) {
      return done(new Error('Missing Facebook appID or appSecret'));
    }

    User.findByFacebookID(profile.id, function (err, user) {
      if (err || user) {
        return done(err, user);
      }

      if (!options.registration.simple) {
        return done(null, false, {
          message: 'Unknown user'
        });
      }

      User.createByFacebook(profile._json, done);
    });
  });
}

function twitter(options, models) {
  return new _passportTwitter.Strategy({
    consumerKey: options.twitter.consumerKey,
    consumerSecret: options.twitter.consumerSecret
  }, function (token, tokenSecret, profile, done) {
    var User = models.User;

    if (!profile.id) {
      return done(new Error('Profile ID is null'));
    }

    if (!options.twitter.consumerKey || !options.twitter.consumerSecret) {
      return done(new Error('Missing Twitter consumerKey or consumerSecret'));
    }

    User.findByTwitterID(profile.id, function (err, user) {
      if (err || user) {
        return done(err, user);
      }

      if (!options.registration.simple) {
        return done(null, false, {
          message: 'Unknown user'
        });
      }

      User.createByTwitter(profile, done);
    });
  });
}

function facebookCanvas(options, models) {
  return new _passportFacebookCanvas.Strategy({
    clientID: options.facebook.appID,
    clientSecret: options.facebook.appSecret
  }, function (accessToken, refreshToken, profile, done) {
    var User = models.User;

    if (!profile.id) {
      return done(new Error('Profile ID is null'));
    }

    if (!options.facebook.appID || !options.facebook.appSecret) {
      return done(new Error('Missing Facebook appID or appSecret'));
    }

    User.findByFacebookID(profile.id, function (err, user) {
      if (err || user) {
        return done(err, user);
      }

      if (!options.registration.simple) {
        return done(null, false, {
          message: 'Unknown user'
        });
      }

      User.createByFacebook(profile._json, done);
    });
  });
}