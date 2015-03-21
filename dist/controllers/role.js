"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

exports.role = role;

/**
 * Create new role
 */
exports.create = create;

/**
 * Remove existing role
 */
exports.remove = remove;

/**
 * Return true if role exists
 */
exports.exists = exists;

/**
 * Get role details
 */
exports.get = get;

/**
 * Grant role or permission to the role
 */
exports.grant = grant;

/**
 * Revoke role or permission to the role
 */
exports.revoke = revoke;

var WebError = _interopRequire(require("web-error"));

function role(req, res, next, name) {
	var rbac = req.server.rbac;

	if (!name) {
		return next(new WebError(400));
	}

	rbac.get(name, function (err, role) {
		if (err) {
			return next(err);
		}

		if (!role || !rbac.isRole(role)) {
			return next(new WebError(404));
		}

		req.objects.role = role;
		next();
	});
}

function create(req, res, next) {
	var rbac = req.server.rbac;

	if (!req.body.name) {
		return next(new WebError(400, "Role name is undefined"));
	}

	rbac.createRole(req.body.name, function (err, role) {
		if (err) {
			return next(err);
		}

		if (!role) {
			return next(new WebError(400));
		}

		return res.jsonp({
			role: {
				name: role.name
			}
		});
	});
}

function remove(req, res, next) {
	var User = req.models.User;

	if (!req.objects.role) {
		return next(new WebError(404));
	}

	var role = req.objects.role;

	//unassign role from all users
	User.removeRoleFromCollection(role.name, function (err) {
		if (err) {
			return next(err);
		}

		//remove role from rbac
		role.remove(function (err, isDeleted) {
			if (err) {
				return next(err);
			}

			if (!isDeleted) {
				return next(new WebError(400));
			}

			return res.status(204).jsonp({});
		});
	});
}

function exists(req, res, next) {
	if (!req.objects.role) {
		return next(new WebError(404));
	}

	return res.status(204).jsonp({});
}

function get(req, res, next) {
	if (!req.objects.role) {
		return next(new WebError(404));
	}

	var role = req.objects.role;

	return res.jsonp({
		role: {
			name: role.name
		}
	});
}

function grant(req, res, next) {
	var rbac = req.server.rbac;

	if (!req.objects.role || !req.body.name) {
		return next(new WebError(400));
	}

	var role = req.objects.role;

	rbac.grantByName(role.name, req.body.name, function (err, isGranted) {
		if (err) {
			return next(err);
		}

		if (!isGranted) {
			return next(new WebError(400));
		}

		return res.status(204).jsonp({});
	});
}

function revoke(req, res, next) {
	var rbac = req.server.rbac;

	if (!req.objects.role || !req.body.name) {
		return next(new WebError(400));
	}

	var role = req.objects.role;

	rbac.revokeByName(role.name, req.body.name, function (err, isRevoked) {
		if (err) {
			return next(err);
		}

		if (!isRevoked) {
			return next(new WebError(400));
		}

		return res.status(204).jsonp({});
	});
}

Object.defineProperty(exports, "__esModule", {
	value: true
});