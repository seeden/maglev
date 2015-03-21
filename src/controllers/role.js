import WebError from 'web-error';

export function role(req, res, next, name) {
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
}


/**
 * Create new role
 */
export function create(req, res, next) {
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
				name: role.name	
			}
		});
	});
}

/**
 * Remove existing role
 */
export function remove(req, res, next) {
	var User = req.models.User;

	if(!req.objects.role) {
		return next(new WebError(404));
	}

	var role = req.objects.role;

	//unassign role from all users
	User.removeRoleFromCollection(role.name, function(err) {
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

			return res.status(204).jsonp({});
		});
	});
}

/**
 * Return true if role exists
 */
export function exists(req, res, next) {
	if(!req.objects.role) {
		return next(new WebError(404));
	}

	return res.status(204).jsonp({});
}

/**
 * Get role details
 */
export function get(req, res, next) {
	if(!req.objects.role) {
		return next(new WebError(404));
	}

	var role = req.objects.role;

	return res.jsonp({
		role: {
			name: role.name	
		}
	});
}

/**
 * Grant role or permission to the role
 */
export function grant(req, res, next) {
	var rbac = req.server.rbac;

	if(!req.objects.role || !req.body.name) {
		return next(new WebError(400));
	}

	var role = req.objects.role;

	rbac.grantByName(role.name, req.body.name, function(err, isGranted) {
		if(err) {
			return next(err);
		}

		if(!isGranted) {
			return next(new WebError(400));
		}

		return res.status(204).jsonp({});
	});
}

/**
 * Revoke role or permission to the role
 */
export function revoke(req, res, next) {
	var rbac = req.server.rbac;

	if(!req.objects.role || !req.body.name) {
		return next(new WebError(400));
	}

	var role = req.objects.role;

	rbac.revokeByName(role.name, req.body.name, function(err, isRevoked) {
		if(err) {
			return next(err);
		}

		if(!isRevoked) {
			return next(new WebError(400));
		}

		return res.status(204).jsonp({});
	});
}