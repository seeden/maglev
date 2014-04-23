'use strict';

/**
 * Return middleware function for permission check
 * @param  {String}  action    Name of action
 * @param  {String}  resource  Name of resource
 * @param  {String}  redirect Url where is user redirected when he has no permissions
 * @param  {Number}  status   Status code of redirect action
 * @return {Function}          Middleware function
 */
exports.can = function(action, resource, redirect, status) {
	status = status || 302;

	return function(req, res, next) {
		req.can(action, resource, function(err, can) {
			if(err) {
				return next(err);
			}

			if(!can) {
				return next(new Error('You have no permission for this action'));	
			}

			if(redirect) {
				return res.redirect(status, redirect);
			}

			next();
		});
	};
};

/**
 * Return middleware function for permission check
 * @param  {String}  name   Name of role
 * @param  {String}  redirect Url where is user redirected when he has no permissions
 * @param  {Number}  status   Status code of redirect action
 * @return {Function}       Middleware function
 */
exports.hasRole = function(name, redirect, status) {
	status = status || 302;

	return function(req, res, next) {
		req.hasRole(name, function(err, has) {
			if(err) {
				return next(err);
			}

			if(!has) {
				return next(new Error('You have no permission for this action'));	
			}


			if(redirect) {
				return res.redirect(status, redirect);
			}

			next();			
		});
	};
};

/**
 * Allow only guest user show content
 * @param  {String}  redirect Url where is user redirected when he has no permissions
 * @param  {Number}  status   Status code of redirect action
 * @return {Function}	Middleware function
 */
exports.isGuest = function(redirect, status) {
	status = status || 302;

	return function(req, res, next) {
		if(req.isGuest() === true) {
			next();
		}

		if(redirect) {
			return res.redirect(status, redirect);
		}

		return next(new Error('You are not a guest'));
	};
};