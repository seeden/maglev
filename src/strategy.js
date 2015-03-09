import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as BearerStrategy } from 'passport-http-bearer';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';

import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import { Strategy as FacebookCanvasStrategy } from 'passport-facebook-canvas';

import jwt from 'jsonwebtoken';
import WebError from 'web-error';

export function anonymous() {
	return new AnonymousStrategy();
}

export function local(options, models) {
	// Use local strategy TODO find by object
	return new LocalStrategy({
		usernameField: 'username',
		passwordField: 'password'
	}, function(email, password, done) {
		var User = models.User;

		User.findOne({
			email: email
		}, function(err, user) {
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
};

export function bearer(options, models) {
	return new BearerStrategy(function(token, done) {
		var User = models.User;

		if(!token) {
			return done(new WebError(401, 'Invalid token'));	
		}

		jwt.verify(token, options.token.secret, function(err, data) {
			if (err) {
				return done(new WebError(401, err.message));	
			}

			if(!data.user) {
				return done(new WebError(404, 'Unknown user'));
			}

			User.findById(data.user, function(err, user) {
				if (err) {
					return done(err);
				}

				if (!user) {
					return done(new WebError(404, 'Unknown user'));
				}

				return done(null, user);
			});
		});
	});
}

export function facebook(options, models) {
	return new FacebookStrategy({
		clientID: options.facebook.clientID,
		clientSecret: options.facebook.clientSecret
	}, function(accessToken, refreshToken, profile, done) {
		var User = models.User;

		if (!profile.id) {
			return done(new Error('Profile ID is null'));
		}

		if(!options.facebook.clientID || !options.facebook.clientSecret) {
			return done(new Error('Missing Facebook clientID or clientSecret'));
		}
			
		User.findByFacebookID(profile.id, function(err, user) {
			if (err || user) {
				return done(err, user);
			}

			if (!options.registration.simple) {
				return done(null, false, {
					message: 'Unknown user'
				});
			}

			User.createByFacebook(profile._json, function(err, user) {
				return done(err, user);
			});
		});
	});
}

export function twitter(options, models) {
	return new TwitterStrategy({
		consumerKey: options.twitter.consumerKey,
		consumerSecret: options.twitter.consumerSecret
	}, function(token, tokenSecret, profile, done) {
		var User = models.User;

		if (!profile.id) {
			return done(new Error('Profile ID is null'));
		}

		if(!options.twitter.consumerKey || !options.twitter.consumerSecret) {
			return done(new Error('Missing Twitter consumerKey or consumerSecret'));
		}

		User.findByTwitterID(profile.id, function(err, user) {
			if (err || user) {
				return done(err, user);
			}

			if (!options.registration.simple) {
				return done(null, false, {
					message: 'Unknown user'
				});
			}

			User.createByTwitter(profile, function(err, user) {
				return done(err, user);
			});
		});
	});
}

export function facebookCanvas(options, models) {
	return new FacebookCanvasStrategy({
		clientID: options.facebook.clientID,
		clientSecret: options.facebook.clientSecret
	}, function(accessToken, refreshToken, profile, done) {
		var User = models.User;

		if (!profile.id) {
			return done(new Error('Profile ID is null'));
		}

		if(!options.facebook.clientID || !options.facebook.clientSecret) {
			return done(new Error('Missing Facebook clientID or clientSecret'));
		}

		User.findByFacebookID(profile.id, function(err, user) {
			if (err || user) {
				return done(err, user);
			}

			if (!options.registration.simple) {
				return done(null, false, {
					message: 'Unknown user'
				});
			}

			User.createByFacebook(profile._json, function(err, user) {
				return done(err, user);
			});
		});
	});
}