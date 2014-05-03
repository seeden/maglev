'use strict';

var jwt = require('jsonwebtoken'),
	async = require('async'),
	WebError = require('web-error');

exports.change = function(req, res, next) {
	var user = req.objects.user;

	if(!user) {
		return res.jsonp(404, {
			error: 'User is not defined'
		});
	}

	if(!req.body.password) {
		return res.jsonp(401, {
			error: 'Parameter password is missing'
		});
	}

	if(!user.hasPassword()) {
		user.setPassword(req.body.password, function(err) {
			if(err) {
				return next(err);
			}

			return res.jsonp({
				status: 'success'
			});
		});
	} else {
		if(!req.body.password_old) {
			return res.jsonp(400, {
				error: 'Parameter password_old is missing'
			});
		}

		user.comparePassword(req.body.password_old, function(err, isMatch) {
			if(err) {
				return next(err);
			}

			if(!isMatch) {
				return res.jsonp(400, {
					error: 'Password is not match with actual password'
				});
			}

			user.setPassword(req.body.password, function(err) {
				if(err) {
					return next(err);
				}

				return res.jsonp({
					status: 'success'
				});
			});			
		});
	}
};

var generateForgotToken = exports.generateForgotToken = function(user, tokenSecret, expiresInMinutes) {
	if(!tokenSecret) {
		throw new Error('Token secret is undefined');
	}

	expiresInMinutes = expiresInMinutes || 60*24;

	var data = { 
		userID: user._id
	};

	return jwt.sign(data, tokenSecret, { expiresInMinutes: expiresInMinutes });
};

exports.forgot = function(req, res, next) {
	var server = req.server;
	var config = server.config;
	var mail = server.mail;

	if(!req.body.username) {
		return res.jsonp(401, {
			error: 'Parameter username is missing'
		});
	}

	User.findByUsername(req.body.username, function(err, user) {
		if(err) {
			return next(err);
		}

		if(!user) {
			return new WebError(404);
		}

		if(!user.hasEmail()) {
			return new WebError(401, 'User has no email');
		}

		//generate token
		var token = generateForgotToken(user, config.mail.token.secret, config.mail.token.expiration);

		//render mails
		var data = {
			from: config.mail.default.from,
			to: user.email,
			subject: 'Password Assistance',
			token: token,
			response: config.mail.uri.forgetResponse	
		};
		
		async.series({
			html: function(callback){
				res.render('mail/forget', data, callback);
			},
			text: function(callback) {
				res.render('mail/forget_plain', data, callback);
			}
		}, function(err, result) {
			if(err) {
				return next(new Error(err));
			}

			var mailOptions = {
				from: config.mail.from,
				to: user.email,
				subject: 'Password Assistance',
				html: result.html,
				text: result.text
			};	

			mail.sendMail(mailOptions, function(err) {
				if(err) {
					return next(new Error(err));
				}

				return res.jsonp({
					status: 'success'
				});	
			});
		});

	});
};


exports.forgotResponse = function(req, res, next) {
	var User = req.models.User;
	var config = req.server.config;

	if(!req.query.token) {
		return res.jsonp(400, {
			error: 'Token is undefined'
		});	
	}

	jwt.verify(req.query.token, config.mail.token.secret, function(err, data) {
		if (err) {
			return next(err);
		}

		if(!data.userID) {
			return res.jsonp(400, {
				error: 'Unknown user'
			});	
		}

		User.findByID(data.userID, function(err, user) {
			if (err) {
				return next(err);
			}

			if (!user) {
				return next(400, {
					error: 'Unknown user'
				});
			}

			req.login(user);

			user.setPassword(null, function(err, user) {
				if (err) {
					return next(err);
				}

				res.redirect(config.mail.uri.changePassword);
			});
		});
	});	
};