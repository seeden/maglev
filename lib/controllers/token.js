'use strict';

var WebError = require('web-error');

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
			token_type: 'Bearer',
			access_token: accessToken
		});
	});
};

exports.invalidate = function(req, res, next) {
	if(!req.body.access_token) {
		return next(new WebError(400, 'Token is missing'));
	}

	//TODO remove from keystore db and invalidate token
	return res.jsonp({
		access_token: req.body.access_token
	});
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