'use strict';

var WebError = require('web-error'),
	tv4 = require('tv4');

exports.isOwner = function(req, res, next) {
	if(!req.user) {
		return next(new WebError(401));
	}

	if(!req.objects.user) {
		return next(new WebError(404));
	}

	if(!req.user.equals(req.objects.user)) {
		return next(new WebError(401));
	}

	next();
};

exports.user = function(req, res, next, id) {
	var User = req.models.User;

	if(!id) {
		return next(new WebError(400));
	}

	User.findByID(id, function(err, user) {
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

exports.permalink = function(req, res, next, id) {
	var User = req.models.User;

	if(!id) {
		return next(new WebError(400));
	}

	User.findByPermalink(id, function(err, user) {
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
	var User = req.models.User,
		rbac = req.server.rbac,
		config = req.server.config;

	var result = tv4.validateMultiple(req.body, createSchema);
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

		user.getPrivateJSON(rbac, function(err, json) {
			if(err) {
				return next(err);
			}

			var accessToken = user.generateAccessToken(config.token.secret, config.token.expiration);

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
	var rbac = req.server.rbac;

	if(!user) {
		return next(new WebError(404));
	}

	user.getPrivateJSON(rbac, function(err, json) {
		if(err) {
			return next(err);
		}

		res.jsonp({
			user: json
		});
	});
};

var createSchema = exports.createSchema = {
	title: "Valid parameters for create a new user",
	type: "object",
	properties: {
		firstName: { 
			type: 'string',
			minLength: 1
		},
		lastName: { 
			type: 'string',
			minLength: 1
		},
		name: { 
			type: 'string',
			minLength: 1
		},
		username: { 
			type: 'string',
			minLength: 1
		},
		email: { 
			type: 'string',
			format: 'email'
		},
		password: {
			type: "string",
			minLength: 6
		}
	},
	required: ['email', 'password'],
	additionalProperties: false
};


var updateSchema = exports.updateSchema = {
	title: "Valid parameters for update user",
	type: "object",
	properties: {
		firstName: { 
			type: 'string',
			minLength: 1
		},
		lastName: { 
			type: 'string',
			minLength: 1
		},
		name: { 
			type: 'string',
			minLength: 1
		},
		username: { 
			type: 'string',
			minLength: 1
		},
		email: { 
			type: 'string',
			format: 'email'
		}
	},
	additionalProperties: false
};