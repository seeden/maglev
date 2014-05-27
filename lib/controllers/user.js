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

/**
 * Create user by simple registraion
 */
exports.create = function(req, res, next) {
	var User = req.models.User;

	var valid = tv4.validate(req.body, createSchema);
	if(!valid) {
		return next(new WebError(400, tv4.error));
	}

	User.create(req.body, function(err, user) {
		if(err) {
			return next(err);
		}

		if(!user) {
			return next(new Error('User is undefined'));
		}

		res.jsonp({
			user: {
				id: user.id	
			}
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

		res.jsonp(204, {});
	});
};

exports.current = function(req, res) {
	var user = req.user;

	if(!user) {
		return next(new WebError(404));
	}

	res.jsonp({
		user: {
			id: user.id	
		}
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
		},
		password: {
			type: "string",
			minLength: 6
		}
	},
	additionalProperties: false
};