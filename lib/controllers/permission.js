'use strict';

var WebError = require('web-error');

exports.permission = function(req, res, next, name) {
	var rbac = req.server.rbac;

	if(!name) {
		return next(new WebError(400));
	}

	rbac.get(name, function(err, permission) {
		if(err) {
			return next(err);
		}

		if(!permission || !rbac.isPermission(permission)) {
			return next(new WebError(404));
		}

		req.objects.permission = permission;
		next();
	});
};


/**
 * Create new permission
 */
exports.create = function(req, res, next) {
	var rbac = req.server.rbac;

	if(!req.body.action || !req.body.resource) {
		return next(new WebError(400, 'Permission action or resource is undefined'));
	}

	rbac.createPermission(req.body.action, req.body.resource, function(err, permission) {
		if(err) {
			return next(err);
		}

		if(!permission) {
			return next(new WebError(400));
		}

		return res.jsonp({
			permission: {
				action: permission.getAction(),
				resource: permission.getResource(),
				name: permission.getName()
			}
		});
	});
};

/**
 * Remove existing permission
 */
exports.remove = function(req, res, next) {
	var User = req.models.User;

	if(!req.objects.permission) {
		return next(new WebError(404));
	}

	var permission = req.objects.permission;

	//unassign permission from all users
	User.removePermissionFromCollection(permission.getName(), function(err) {
		if(err) {
			return next(err);
		}

		permission.remove(function(err, isDeleted) {
			if(err) {
				return next(err);
			}

			if(!isDeleted) {
				return next(new WebError(400));
			}

			return res.status(204).jsonp({});
		});
	});
};

/**
 * Return true if poermission exists
 */
exports.exists = function(req, res, next) {
	if(!req.objects.permission) {
		return next(new WebError(404));
	}

	return res.status(204).jsonp({});
};

/**
 * Get permission details
 */
exports.get = function(req, res, next) {
	if(!req.objects.permission) {
		return next(new WebError(404));
	}

	var permission = req.objects.permission;

	return res.jsonp({
		permission: {
			action: permission.getAction(),
			resource: permission.getResource(),
			name: permission.getName()
		}
	});
};