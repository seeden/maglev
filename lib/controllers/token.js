'use strict';

var WebError = require('web-error');

exports.generateForCurrent = function(req, res, next) {
	var user = req.user;
	var config = req.server.config;
	var rbac = req.server.rbac;

	if(!user) {
		return next(new WebError(401));
	}

	var accessToken = user.generateAccessToken(config.token.secret, config.token.expiration);

	user.getPrivateJSON(rbac, function(err, json) {
		if(err) {
			return next(err);
		}

		res.jsonp({
			token: {
				type: 'Bearer',
				access_token: accessToken
			},
			user: json
		});
	});
};

exports.generate = function(req, res, next) {
	var User = req.models.User;
	var config = req.server.config;
	var rbac = req.server.rbac;

	if(!req.body.username || !req.body.password) {
		return next(new WebError(400, 'One of parameter missing'));
	}

	User.findByUsernamePassword(req.body.username, req.body.password, false, function(err, user) {
		if(err) {
			return next(err);
		}

		if(!user) {
			return next(new WebError(404, 'Invalid username or password'));
		}

		var accessToken = user.generateAccessToken(config.token.secret, config.token.expiration);

		user.getPrivateJSON(rbac, function(err, json) {
			if(err) {
				return next(err);
			}

			res.jsonp({
				token: {
					type: 'Bearer',
					access_token: accessToken
				},
				user: json
			});
		});
	});
};

exports.invalidate = function(req, res, next) {
	if(!req.body.access_token) {
		return next(new WebError(400, 'Token is missing'));
	}

	//TODO remove from keystore db and invalidate token
	return res.status(501).jsonp({});
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

exports.tryEnsure = function(req, res, next) {
	req.server.secure.authenticate(['bearer', 'anonymous'], { 
		session: false
	})(req, res, next);
};