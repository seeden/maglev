'use strict';

var WebError = require('web-error');

exports.generateForCurrent = function(req, res, next) {
	var user = req.user;
	var config = req.server.config;

	if(!user) {
		return next(new WebError(401));
	}

	var accessToken = user.generateAccessToken(config.token.secret, config.token.expiration);

	return res.jsonp({
		token: {
			type: 'Bearer',
			access_token: accessToken
		},
		user: {
			id: user.id
		}
	});
};

exports.generate = function(req, res, next) {
	var User = req.models.User;
	var config = req.server.config;

	if(!req.body.username || !req.body.password) {
		return next(new WebError(400, 'One of parameter missing'));
	}

	User.findByUsernamePassword(req.body.username, req.body.password, function(err, user) {
		if(err) {
			return next(err);
		}

		if(!user) {
			return next(new WebError(404, 'Invalid username or password'));
		}

		var accessToken = user.generateAccessToken(config.token.secret, config.token.expiration);

		return res.jsonp({
			token: {
				type: 'Bearer',
				access_token: accessToken
			},
			user: {
				id: user.id
			}
		});
	});
};

exports.invalidate = function(req, res, next) {
	if(!req.body.access_token) {
		return next(new WebError(400, 'Token is missing'));
	}

	//TODO remove from keystore db and invalidate token
	return res.jsonp(501, {});
};

exports.ensure = function(req, res, next) {
	req.server.secure.authenticate('bearer', { 
		session: false
	})(req, res, next);
};

exports.ensureWithSession = function(req, res, next) {
	if (req.isAuthenticated() === true) {
		return next(); // already authenticated via session cookie
	}

	req.server.secure.authenticate('bearer', { 
		session: false
	})(req, res, next);
};