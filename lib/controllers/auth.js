'use strict';

/**
 * Login user by his username and password
 * @param  {String} failureRedirect Url for failured login attempt
 * @return {Function} Controller function
 */
exports.login = function(failureRedirect) {
	return function(req, res, next) {
		req.server.secure.authenticate('local', { 
			failureRedirect: failureRedirect 
		})(req, res, next);
	};
};

exports.login = function(req, res, next) {
	req.server.secure.authenticate('local', {})(req, res, next);
};

exports.ensure = function(req, res, next) {
	if (req.isAuthenticated() === true) {
		return next();
	}

	return res.status(401).format({
		'text/plain': function() {
			res.send('User is not authorized');
		},
  
		'text/html': function() {
			res.send('User is not authorized');
		},
  
		'application/json': function() {
			res.jsonp({ 
				error: 'User is not authorized' 
			});
		}
	});
};

exports.logout = function(req, res, next) {
	req.logout();
	next();
};