"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

exports.anonymous = anonymous;
exports.local = local;
exports.bearer = bearer;
exports.facebook = facebook;
exports.twitter = twitter;
exports.facebookCanvas = facebookCanvas;

var LocalStrategy = require("passport-local").Strategy;

var BearerStrategy = require("passport-http-bearer").Strategy;

var AnonymousStrategy = require("passport-anonymous").Strategy;

var FacebookStrategy = require("passport-facebook").Strategy;

var TwitterStrategy = require("passport-twitter").Strategy;

var FacebookCanvasStrategy = require("passport-facebook-canvas").Strategy;

var jwt = _interopRequire(require("jsonwebtoken"));

var WebError = _interopRequire(require("web-error"));

function anonymous() {
	return new AnonymousStrategy();
}

function local(options, models) {
	// Use local strategy TODO find by object
	return new LocalStrategy({
		usernameField: "username",
		passwordField: "password"
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
					message: "Unknown user"
				});
			}

			if (!user.authenticate(password)) {
				return done(null, false, {
					message: "Invalid password"
				});
			}

			return done(null, user);
		});
	});
}

;

function bearer(options, models) {
	return new BearerStrategy(function (token, done) {
		var User = models.User;

		if (!token) {
			return done(new WebError(401, "Invalid token"));
		}

		jwt.verify(token, options.token.secret, function (err, data) {
			if (err) {
				return done(new WebError(401, err.message));
			}

			if (!data.user) {
				return done(new WebError(404, "Unknown user"));
			}

			User.findById(data.user, function (err, user) {
				if (err) {
					return done(err);
				}

				if (!user) {
					return done(new WebError(404, "Unknown user"));
				}

				return done(null, user);
			});
		});
	});
}

function facebook(options, models) {
	return new FacebookStrategy({
		clientID: options.facebook.appID,
		clientSecret: options.facebook.appSecret
	}, function (accessToken, refreshToken, profile, done) {
		var User = models.User;

		if (!profile.id) {
			return done(new Error("Profile ID is null"));
		}

		if (!options.facebook.appID || !options.facebook.appSecret) {
			return done(new Error("Missing Facebook appID or appSecret"));
		}

		User.findByFacebookID(profile.id, function (err, user) {
			if (err || user) {
				return done(err, user);
			}

			if (!options.registration.simple) {
				return done(null, false, {
					message: "Unknown user"
				});
			}

			User.createByFacebook(profile._json, function (err, user) {
				return done(err, user);
			});
		});
	});
}

function twitter(options, models) {
	return new TwitterStrategy({
		consumerKey: options.twitter.consumerKey,
		consumerSecret: options.twitter.consumerSecret
	}, function (token, tokenSecret, profile, done) {
		var User = models.User;

		if (!profile.id) {
			return done(new Error("Profile ID is null"));
		}

		if (!options.twitter.consumerKey || !options.twitter.consumerSecret) {
			return done(new Error("Missing Twitter consumerKey or consumerSecret"));
		}

		User.findByTwitterID(profile.id, function (err, user) {
			if (err || user) {
				return done(err, user);
			}

			if (!options.registration.simple) {
				return done(null, false, {
					message: "Unknown user"
				});
			}

			User.createByTwitter(profile, function (err, user) {
				return done(err, user);
			});
		});
	});
}

function facebookCanvas(options, models) {
	return new FacebookCanvasStrategy({
		clientID: options.facebook.appID,
		clientSecret: options.facebook.appSecret
	}, function (accessToken, refreshToken, profile, done) {
		var User = models.User;

		if (!profile.id) {
			return done(new Error("Profile ID is null"));
		}

		if (!options.facebook.appID || !options.facebook.appSecret) {
			return done(new Error("Missing Facebook appID or appSecret"));
		}

		User.findByFacebookID(profile.id, function (err, user) {
			if (err || user) {
				return done(err, user);
			}

			if (!options.registration.simple) {
				return done(null, false, {
					message: "Unknown user"
				});
			}

			User.createByFacebook(profile._json, function (err, user) {
				return done(err, user);
			});
		});
	});
}

Object.defineProperty(exports, "__esModule", {
	value: true
});