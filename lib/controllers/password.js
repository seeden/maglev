'use strict';

var jwt = require('jsonwebtoken');
var async = require('async');
var WebError = require('web-error');


exports.tokenToUser = function(req, res, next) {
	var User = req.models.User;
	var config = req.server.config;

	if(!id) {
		return next(new WebError(400, 'Token is undefined'));
	}

	jwt.verify(id, config.mail.token.secret, function(err, data) {
		if (err) {
			return next(err);
		}

		if(!data.user) {
			return next(new WebError(400, 'Unknown user'));
		}


		User.findById(id, function(err, user) {
			if(err) {
				return next(err);
			}

			if(!user) {
				return next(new WebError(404));
			}

			req.objects.user = user;
			next();
		});
	});
};


/**
 * Change user password
 */
exports.change = function(req, res, next) {
	var user = req.objects.user;

	if(!user) {
		return next(new WebError(404));
	}

	if(!req.body.password) {
		return next(new WebError(400, 'Parameter password is missing'));
	}

	if(!user.hasPassword()) {
		user.setPassword(req.body.password, function(err) {
			if(err) {
				return next(err);
			}

			return res.status(204).jsonp({});
		});
	} else {
		if(!req.body.password_old) {
			return next(new WebError(400, 'Parameter password_old is missing'));
		}

		user.comparePassword(req.body.password_old, function(err, isMatch) {
			if(err) {
				return next(err);
			}

			if(!isMatch) {
				return next(new WebError(400, 'Password is not match with actual password'));
			}

			user.setPassword(req.body.password, function(err) {
				if(err) {
					return next(err);
				}

				return res.status(204).jsonp({});
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
		user: user._id
	};

	return jwt.sign(data, tokenSecret, { expiresInMinutes: expiresInMinutes });
};

exports.forgot = function(req, res, next) {
	var User = req.models.User;

	var server = req.server;
	var config = server.config;
	var mail = server.mail;

	if(!req.body.username) {
		return next(new WebError(400, 'Parameter username is missing'));
	}

	User.findByUsername(req.body.username, false, function(err, user) {
		if(err) {
			return next(err);
		}

		if(!user) {
			return next(new WebError(404));
		}

		if(!user.hasEmail()) {
			return next(new WebError(401, 'User has no email'));
		}

		//generate token
		var token = generateForgotToken(user, config.mail.token.secret, config.mail.token.expiration);

		//render mails
		var data = {
			user: user,
			from: config.mail.default.from,
			to: user.email,
			subject: 'Password Assistance',
			token: token
		};
		
		async.series({
			html: function(callback){
				res.render('mail/forgot', data, callback);
			},
			text: function(callback) {
				res.render('mail/forgot_plain', data, callback);
			}
		}, function(err, result) {
			if(err) {
				return next(new Error(err));
			}

			var mailOptions = {
				from: config.mail.default.from,
				to: user.email,
				subject: 'Password Assistance',
				html: result.html,
				text: result.text
			};	

			mail.sendMail(mailOptions, function(err) {
				if(err) {
					return next(new Error(err));
				}

				return res.status(204).jsonp({});	
			});
		});
	});
};