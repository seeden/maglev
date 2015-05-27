"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

exports.permission = permission;

/**
 * Create new permission
 */
exports.create = create;

/**
 * Remove existing permission
 */
exports.remove = remove;

/**
 * Return true if poermission exists
 */
exports.exists = exists;

/**
 * Get permission details
 */
exports.get = get;

var WebError = _interopRequire(require("web-error"));

function permission(req, res, next, name) {
	var rbac = req.server.rbac;

	if (!name) {
		return next(new WebError(400));
	}

	rbac.getPermissionByName(name, function (err, permission) {
		if (err) {
			return next(err);
		}

		if (!permission) {
			return next(new WebError(404));
		}

		req.objects.permission = permission;
		next();
	});
}

function create(req, res, next) {
	var rbac = req.server.rbac;

	if (!req.body.action || !req.body.resource) {
		return next(new WebError(400, "Permission action or resource is undefined"));
	}

	rbac.createPermission(req.body.action, req.body.resource, function (err, permission) {
		if (err) {
			return next(err);
		}

		if (!permission) {
			return next(new WebError(400));
		}

		return res.jsonp({
			permission: {
				action: permission.action,
				resource: permission.resource,
				name: permission.name
			}
		});
	});
}

function remove(req, res, next) {
	var User = req.models.User;

	if (!req.objects.permission) {
		return next(new WebError(404));
	}

	var permission = req.objects.permission;

	//unassign permission from all users
	User.removePermissionFromCollection(permission.name, function (err) {
		if (err) {
			return next(err);
		}

		permission.remove(function (err, isDeleted) {
			if (err) {
				return next(err);
			}

			if (!isDeleted) {
				return next(new WebError(400));
			}

			return res.status(204).end();
		});
	});
}

function exists(req, res, next) {
	if (!req.objects.permission) {
		return next(new WebError(404));
	}

	return res.status(204).end();
}

;
function get(req, res, next) {
	if (!req.objects.permission) {
		return next(new WebError(404));
	}

	var permission = req.objects.permission;

	return res.jsonp({
		permission: {
			action: permission.action,
			resource: permission.resource,
			name: permission.name
		}
	});
}

Object.defineProperty(exports, "__esModule", {
	value: true
});