'use strict';

/**
 * Return middleware function for permission check
 * @param  {String}  action    Name of action
 * @param  {String}  resource  Name of resource
 * @return {Function}          Middleware function
 */
exports.isAllowed = function(action, resource) {
	return function(req, res, next) {
		if(req.isAllowed(action, resource) === true) {
			next();
		}

		return next(new Error('You have no permission for this action'));
	};
};

/**
 * Return middleware function for permission check
 * @param  {String}  name   Name of role
 * @return {Function}       Middleware function
 */
exports.hasRole = function(name) {
	return function(req, res, next) {
		if(req.hasRole(name) === true) {
			next();
		}

		return next(new Error('You have no permission for this action'));
	};
};