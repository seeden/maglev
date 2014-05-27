'use strict';

var WebError = require('web-error');

exports.role = function(req, res, next, name) {
	var rbac = req.server.rbac;

	if(!name) {
		return next(new WebError(400));
	}

	rbac.get(name, function(err, role) {
		if(err) {
			return next(err);
		}

		if(!role || !rbac.isRole(role)) {
			return next(new WebError(404));
		}

		req.objects.role = role;
		next();
	});
};


/**
 * Create new role
 */
exports.create = function(req, res, next) {
	var rbac = req.server.rbac;

	if(!req.body.name) {
		return next(new WebError(400, 'Role name is undefined'));
	}

	rbac.createRole(req.body.name, function(err, role) {
		if(err) {
			return next(err);
		}

		if(!role) {
			return next(new WebError(400));
		}

		return res.jsonp({
			role: {
				name: role.getName()	
			}
		});
	});
};

/**
 * Remove existing role
 */
exports.remove = function(req, res, next) {
	var User = req.models.User;

	if(!req.objects.role) {
		return next(new WebError(404));
	}

	var role = req.objects.role;

	//unassign role from all users
	User.removeRoleFromAllUsers(role.getName(), function(err) {
		if(err) {
			return next(err);
		}

		//remove role from rbac
		role.remove(function(err, isDeleted) {
			if(err) {
				return next(err);
			}

			if(!isDeleted) {
				return next(new WebError(400));
			}

			return res.jsonp(204, {});
		});
	});
};

/**
 * Return true if role exists
 */
exports.exists = function(req, res, next) {
	if(!req.objects.role) {
		return next(new WebError(404));
	}

	return res.jsonp(204, {});
};

/**
 * Get role details
 */
exports.get = function(req, res, next) {
	if(!req.objects.role) {
		return next(new WebError(404));
	}

	var role = req.objects.role;

	return res.jsonp({
		role: {
			name: role.getName()	
		}
	});
};

/**
 * Grant role or permission to the role
 */
exports.grant = function(req, res, next) {
	var rbac = req.server.rbac;

	if(!req.objects.role || !req.body.name) {
		return next(new WebError(400));
	}

	var role = req.objects.role;

	rbac.grantByName(role.getName(), req.body.name, function(err, isGranted) {
		if(err) {
			return next(err);
		}

		if(!isGranted) {
			return next(new WebError(400));
		}

		return res.jsonp(204, {});
	});
};

/**
 * Revoke role or permission to the role
 */
exports.revoke = function(req, res, next) {
	var rbac = req.server.rbac;

	if(!req.objects.role || !req.body.name) {
		return next(new WebError(400));
	}

	var role = req.objects.role;

	rbac.revokeByName(role.getName(), req.body.name, function(err, isRevoked) {
		if(err) {
			return next(err);
		}

		if(!isRevoked) {
			return next(new WebError(400));
		}

		return res.jsonp(204, {});
	});
};