'use strict';

exports.getScope = function(req, res, next) {
	var rbac = req.server.rbac;
	var user = req.user;
	if(!user) {
		return next(new WebError(401));
	}

	user.getScope(rbac, function(err, scope) {
		if(err) {
			return next(err);
		}

		res.jsonp({
			scope: scope
		});
	});
};

exports.can = function(req, res, next) {
	var rbac = req.server.rbac;
	var user = req.user;
	if(!user) {
		return next(new WebError(401));
	}

	var action = req.body.action;
	var resource = req.body.resource;

	if(!action || !resource) {
		return next(new WebError(400));
	}

	user.can(rbac, action, resource, function(err, can) {
		if(err) {
			return next(err);
		}

		res.jsonp({
			can: can
		});
	});
};

exports.addPermission = function(req, res, next) {
	var rbac = req.server.rbac;
	var user = req.user;
	if(!user) {
		return next(new WebError(401));
	}

	var action = req.body.action;
	var resource = req.body.resource;

	if(!action || !resource) {
		return next(new WebError(400));
	}

	user.addPermission(rbac, action, resource, function(err) {
		if(err) {
			return next(err);
		}

		res.status(204).jsonp({});
	});
};

exports.removePermission = function(req, res, next) {
	var rbac = req.server.rbac;
	var user = req.user;
	if(!user) {
		return next(new WebError(401));
	}

	var permissionName = req.body.permissionName;
	if(!permissionName) {
		return next(new WebError(400));
	}

	user.removePermission(rbac, permissionName, function(err) {
		if(err) {
			return next(err);
		}

		res.status(204).jsonp({});
	});
};

exports.hasRole = function(req, res, next) {
	var rbac = req.server.rbac;
	var user = req.user;
	if(!user) {
		return next(new WebError(401));
	}

	var role = req.body.role;
	if(!role) {
		return next(new WebError(400));
	}

	user.hasRole(rbac, role, function(err, has) {
		if(err) {
			return next(err);
		}

		res.jsonp({
			has: has
		});
	});
};

exports.setRole = function(req, res, next) {
	var rbac = req.server.rbac;
	var user = req.user;
	if(!user) {
		return next(new WebError(401));
	}

	var role = req.body.role;
	if(!role) {
		return next(new WebError(400));
	}

	user.setRole(rbac, role, function(err, has) {
		if(err) {
			return next(err);
		}

		res.status(204).jsonp({});
	});
};

exports.removeRole = function(req, res, next) {
	var user = req.user;
	if(!user) {
		return next(new WebError(401));
	}

	user.removeRole(function(err, has) {
		if(err) {
			return next(err);
		}

		res.status(204).jsonp({});
	});
};