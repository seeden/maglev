'use strict';

exports.create = function(req, res, next) {
	var rbac = req.server.rbac;

	if(!req.body.permission) {
		return next(new Error('Permission name is undefined'));
	}

	var permissionName = req.body.permission;

	try {
		var role = rbac.createPermission(permissionName);

		//TODO store new rbac
		//
		return res.jsonp({
			status: 'success'
		});
	} catch(e) {
		return next(e);
	}
};

exports.get = function(req, res, next) {
	var rbac = req.server.rbac;

	var names = rbac.getRoleNames();

	return res.jsonp({
		status: 'success',
		data: names
	});
};