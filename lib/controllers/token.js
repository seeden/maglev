'use strict';

exports.generate = function(req, res, next) {
	var User = req.models.User;
	var config = req.server.config;

	if(!req.body.username || !req.body.password) return res.jsonp(401, {
			error: 'Wrong user or password'
		});

	User.findByUsernamePassword(req.body.username, req.body.password, function(err, user) {
		if(err) return next(err);
		if(!user) return res.jsonp(404, {
				error: 'User does not exists'
			});

		var accessToken = user.generateAccessToken(config.token.secret, config.token.expiration);

		return res.jsonp({
			token_type: 'Bearer',
			access_token: accessToken
		});
	});
};

exports.invalidate = function(req, res) {
	var User = req.models.User;
	var config = req.server.config;

	if(!req.body.access_token) return res.jsonp(401, {
			error: 'Token is missing'
		});

	//TODO remove from keystore db and invalidate token
	return res.jsonp({
		access_token: req.body.access_token
	});
};

exports.ensure = function(req, res, next) {
    req.server.passport.authenticate('bearer', { 
    	session: false
    })(req, res, next);
};

exports.ensureWithSession = function(req, res, next) {
    if (req.isAuthenticated() === true) return next(); // already authenticated via session cookie

    req.server.passport.authenticate('bearer', { 
    	session: false
    })(req, res, next);
};