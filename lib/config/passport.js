'use strict';

var LocalStrategy = require('passport-local').Strategy,
	FacebookStrategy = require('passport-facebook').Strategy,
	FacebookCanvasStrategy = require('passport-facebook-canvas').Strategy,
	BearerStrategy = require('passport-http-bearer').Strategy,
	jwt = require('jsonwebtoken'),
	passport = require('passport');

exports.passport = passport;

exports.prepare = function(server) {
	var config = server.config;
	var User = server.models.User;

	//configure serialisation
	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function(id, done) {
		User.findByID(id, function(err, user) {
			done(err, user);
		});
	});

	//load strategies
	var strategies = config.secure.strategies;
	for(var i=0; i<strategies.length; i++){
		strategies[i](server);
	}

	return passport;
};

exports.localStrategy = function(server) {
	var User = server.models.User;

	// Use local strategy TODO find by object
	passport.use(new LocalStrategy({
			usernameField: 'username',
			passwordField: 'password'
		},
		function(email, password, done) {
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
		}
	));
};

exports.bearerStrategy = function(server) {
	var config = server.config;
	var User = server.models.User;

	passport.use(new BearerStrategy(function(token, done) {
		jwt.verify(token, config.token.secret, function(err, data) {
			if (err) {
				return done(err);
			}

			if(!data.userID) {
				return done(null, false, {
					message: 'Unknown user'
				});
			}

			User.findByID(data.userID, function(err, user) {
				if (err) {
					return done(err);
				}

				if (!user) {
					return done(null, false, {
						message: 'Unknown user'
					});
				}

				return done(null, user);
			});
		});
	}));
};

exports.facebookStrategy = function(server) {
	var config = server.config;
	var User = server.models.User;

	if(!config.facebook.clientID || !config.facebook.clientSecret) {
		console.log('Missing Facebook clientID or clientSecret');
		return false;	
	}

	passport.use(new FacebookStrategy({
			clientID: config.facebook.clientID,
			clientSecret: config.facebook.clientSecret
		},
		function(accessToken, refreshToken, profile, done) {
			if (!profile.id) {
				return done(new Error('Profile ID is null'));
			}

            User.findByFacebookID(profile.id, function(err, user) {
                if (err || user) {
                	return done(err, user);
                }

                if (!config.registration.simple) return done(null, false, {
						message: 'Unknown user'
					});

                User.createByFacebook(profile._json, function(err, user) {
                    return done(err, user);
                });
            });
		}
	));
};

exports.facebookCanvasStrategy = function(server) {
	var config = server.config;
	var User = server.models.User;

	if(!config.facebook.clientID || !config.facebook.clientSecret) {
		console.log('Missing Facebook clientID or clientSecret');
		return false;	
	}

	passport.use(new FacebookCanvasStrategy({
			clientID: config.facebook.clientID,
			clientSecret: config.facebook.clientSecret
		},
		function(accessToken, refreshToken, profile, done) {
			if (!profile.id) {
				return done(new Error('Profile ID is null'));
			}

            User.findByFacebookID(profile.id, function(err, user) {
                if (err || user) {
                	return done(err, user);
                }

                if (!config.registration.simple) {
                	return done(null, false, {
						message: 'Unknown user'
					});
				}

                User.createByFacebook(profile._json, function(err, user) {
                    return done(err, user);
                });
            });
		}
	));
};