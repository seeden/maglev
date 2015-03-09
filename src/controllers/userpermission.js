export function getScope(req, res, next) {
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
}

export function can(req, res, next) {
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
}

export function addPermission(req, res, next) {
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
}

export function removePermission(req, res, next) {
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
}

export function hasRole(req, res, next) {
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
}

export function setRole(req, res, next) {
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
}

export function removeRole(req, res, next) {
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
}