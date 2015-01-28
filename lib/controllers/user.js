'use strict';

var WebError = require('web-error');
var tv4 = require('tv4');

exports.isOwner = function(req, res, next) {
	if(!req.user || !req.objects.user) {
		return next(new WebError(401));
	}

	if(!req.user.isMe(req.objects.user)) {
		return next(new WebError(401));
	}

	next();
};

exports.user = function(req, res, next, id) {
	var User = req.models.User;

	if(!id) {
		return next(new WebError(400));
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
};

exports.permalink = function(req, res, next, permalink) {
	var User = req.models.User;

	if(!permalink) {
		return next(new WebError(400));
	}

	User.findOne({
		permalink: permalink
	}, function(err, user) {
		if(err) {
			return next(err);
		}

		if(!user) {
			return next(new WebError(404));
		}

		req.objects.user = user;
		next();
	});
};

/**
 * Create user by simple registraion
 */
exports.create = function(req, res, next) {
	var User = req.models.User;
	var config = req.server.config;

	exports.createSchema = exports.createSchema || User.getRestJSONSchema();
	var result = tv4.validateMultiple(req.body, exports.createSchema);
	if(!result.valid) {
		return next(new WebError(400, 'Validation errors', result.errors));
	}

	User.create(req.body, function(err, user) {
		if(err) {
			return next(err);
		}

		if(!user) {
			return next(new Error('User is undefined'));
		}

		res.jsonp({
			token: user.generateBearerToken(config.token.secret, config.token.expiration),
			user: user.toPrivateJSON()
		});
	});
};

exports.delete = function(req, res, next) {
	var user = req.objects.user;

	if(!user) {
		return next(new WebError(404));
	}

	user.remove(function(err) {
		if(err) {
			return next(err);
		}

		res.status(204).jsonp({});
	});
};

exports.current = function(req, res, next) {
	var user = req.user;

	if(!user) {
		return next(new WebError(404));
	}

	res.jsonp({
		user: user.toPrivateJSON()
	});
};