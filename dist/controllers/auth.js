'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});
exports.login = login;
exports.loginOrRedirect = loginOrRedirect;
exports.ensure = ensure;
exports.logout = logout;

function login(req, res, next) {
	req.server.secure.authenticate('local', {})(req, res, next);
}

/**
 * Login user by his username and password
 * @param  {String} failureRedirect Url for failured login attempt
 * @return {Function} Controller function
 */

function loginOrRedirect(failureRedirect) {
	return function (req, res, next) {
		req.server.secure.authenticate('local', {
			failureRedirect: failureRedirect
		})(req, res, next);
	};
}

function ensure(req, res, next) {
	if (req.isAuthenticated() === true) {
		return next();
	}

	return res.status(401).format({
		'text/plain': function textPlain() {
			res.send('User is not authorized');
		},

		'text/html': function textHtml() {
			res.send('User is not authorized');
		},

		'application/json': function applicationJson() {
			res.jsonp({
				error: 'User is not authorized'
			});
		}
	});
}

function logout(req, res, next) {
	req.logout();
	next();
}