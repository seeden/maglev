'use strict';

var WebError = require('WebError');

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
			action: permission.getAction(),
			resource: permission.getResource(),
			name: permission.getName()
		});
	});
};

/**
 * Remove existing permission
 */
exports.remove = function(req, res, next) {
	var rbac = req.server.rbac;

	if(!req.body.name) {
		return next(new WebError(400, 'Permission name is undefined'));
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
 * Return true if poermission exists
 */
exports.exists = function(req, res, next) {
	var rbac = req.server.rbac;

	if(!req.body.name) {
		return next(new WebError(400, 'Permission name is undefined'));
	}

	rbac.existsPermission(req.body.name, function(err, exists) {
		if(err) {
			return next(err);
		}

		return res.jsonp({
			exists: exists
		});
	});
};

/**
 * Get permission details
 */
exports.get = function(req, res, next) {
	var rbac = req.server.rbac;

	if(!req.body.name) {
		return next(new WebError(400, 'Permission name is undefined'));
	}

	rbac.getPermission(req.body.name, function(err, permission) {
		if(err) {
			return next(err);
		}

		if(!permission) {
			return next(new WebError(404));	
		}		

		return res.jsonp({
			action: permission.getAction(),
			resource: permission.getResource(),
			name: permission.getName()
		});
	});
};