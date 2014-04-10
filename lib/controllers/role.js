'use strict';

//TODO store new rbac structure
exports.create = function(req, res, next) {
	var rbac = req.server.rbac;

	if(!req.body.role) {
		return next(new Error('Role name is undefined'));
	}

	var roleName = req.body.role;

	try {
		var role = rbac.createRole(roleName);

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

//TODO store new rbac structure
exports.remove = function(req, res, next) {
	var rbac = req.server.rbac;

	if(!req.body.role) {
		return next(new Error('Role name is undefined'));
	}

	var roleName = req.body.role;

	var role = rbac.getRole(roleName);
	if(!role) {
		return jsonp(404, {
			status: 'fail'
		});
	}

	role.remove();

	return res.jsonp({
		status: 'success'
	});
};