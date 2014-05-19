'use strict';

var WebError = require('web-error');

exports.isOwner = function(req, res, next) {
	if(!req.user) {
		return next(new Error('User is not sign in'));
	}

	if(!req.objects.user) {
		return next(new WebError(404));
	}

	if(!req.user.equals(req.objects.user)) {
		return next(new Error('User is not owner'));
	}

	next();
};

exports.user = function(req, res, next, id) {
	var User = req.models.User;

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

	User.create(req.body, function(err, user) {
		if(err) {
			return next(err);
		}

		if(!user) {
			return next(new Error('User is undefined'));
		}

		res.jsonp({
			id: user._id
		});
	});
};

exports.delete = function(req, res, next) {
	if(!req.objects.user) {
		return next(new WebError(404));
	}

	var user = req.objects.user;

	user.remove(function(err) {
		if(err) {
			return next(err);
		}

		res.jsonp({
			status: 'success'
		});
	});
};

exports.current = function(req, res) {
	if(!req.user) {
		return res.jsonp(404, {});
	}

	var user = req.user;

	res.jsonp({
		id: user._id
	});
};


exports.update = function(req, res, next) {

};