"use strict";

exports.login = login;

/**
 * Login user by his username and password
 * @param  {String} failureRedirect Url for failured login attempt
 * @return {Function} Controller function
 */
exports.loginOrRedirect = loginOrRedirect;
exports.ensure = ensure;
exports.logout = logout;

function login(req, res, next) {
	req.server.secure.authenticate("local", {})(req, res, next);
}

function loginOrRedirect(failureRedirect) {
	return function (req, res, next) {
		req.server.secure.authenticate("local", {
			failureRedirect: failureRedirect
		})(req, res, next);
	};
}

function ensure(req, res, next) {
	if (req.isAuthenticated() === true) {
		return next();
	}

	return res.status(401).format({
		"text/plain": function () {
			res.send("User is not authorized");
		},

		"text/html": function () {
			res.send("User is not authorized");
		},

		"application/json": function () {
			res.jsonp({
				error: "User is not authorized"
			});
		}
	});
}

function logout(req, res, next) {
	req.logout();
	next();
}

Object.defineProperty(exports, "__esModule", {
	value: true
});