'use strict';

var WebError = require('web-error');

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
			name: role.getName()
		});
	});
};

/**
 * Remove existing role
 */
exports.remove = function(req, res, next) {
	var rbac = req.server.rbac;

	if(!req.body.name) {
		return next(new WebError(400, 'Role name is undefined'));
	}

	rbac.removeByName(req.body.name, function(err, isDeleted) {
		if(err) {
			return next(err);
		}

		if(!isDeleted) {
			return next(new WebError(400));
		}

		return res.jsonp({
			status: 'success'
		});
	});
};

/**
 * Return true if role exists
 */
exports.exists = function(req, res, next) {
	var rbac = req.server.rbac;

	if(!req.body.name) {
		return next(new WebError(400, 'Role name is undefined'));
	}

	rbac.existsRole(req.body.name, function(err, exists) {
		if(err) {
			return next(err);
		}

		return res.jsonp({
			exists: exists
		});
	});
};

/**
 * Get role details
 */
exports.get = function(req, res, next) {
	var rbac = req.server.rbac;

	if(!req.body.name) {
		return next(new WebError(400, 'Role name is undefined'));
	}

	rbac.getRole(req.body.name, function(err, role) {
		if(err) {
			return next(err);
		}

		if(!role) {
			return next(new WebError(404));	
		}		

		return res.jsonp({
			name: role.getName()
		});
	});
};

/**
 * Grant role or permission to the role
 */
exports.grant = function(req, res, next) {
	var rbac = req.server.rbac;

	if(!req.body.name || !req.body.grant) {
		return next(new WebError(400, 'One of parameters is undefined'));
	}

	rbac.grantByName(req.body.name, req.body.grant, function(err, isGranted) {
		if(err) {
			return next(err);
		}

		if(!isGranted) {
			return next(new WebError(400));
		}

		return res.jsonp({
			status: 'success'
		});
	});
};

/**
 * Revoke role or permission to the role
 */
exports.revoke = function(req, res, next) {
	var rbac = req.server.rbac;

	if(!req.body.name || !req.body.revoke) {
		return next(new WebError(400, 'One of parameters is undefined'));
	}

	rbac.revokeByName(req.body.name, req.body.revoke, function(err, isRevoked) {
		if(err) {
			return next(err);
		}

		if(!isRevoked) {
			return next(new WebError(400));
		}

		return res.jsonp({
			status: 'success'
		});
	});
};