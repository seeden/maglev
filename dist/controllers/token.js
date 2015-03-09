"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

exports.generateForCurrent = generateForCurrent;
exports.generate = generate;
exports.invalidate = invalidate;
exports.ensure = ensure;
exports.ensureWithSession = ensureWithSession;
exports.tryEnsure = tryEnsure;

var WebError = _interopRequire(require("web-error"));

function generateForCurrent(req, res, next) {
	var user = req.user;
	var config = req.server.config;
	var rbac = req.server.rbac;

	if (!user) {
		return next(new WebError(401));
	}

	res.jsonp({
		token: user.generateBearerToken(config.token.secret, config.token.expiration),
		user: user.toPrivateJSON()
	});
}

function generate(req, res, next) {
	var User = req.models.User;
	var config = req.server.config;
	var rbac = req.server.rbac;

	if (!req.body.username || !req.body.password) {
		return next(new WebError(400, "One of parameter missing"));
	}

	User.findByUsernamePassword(req.body.username, req.body.password, false, function (err, user) {
		if (err) {
			return next(err);
		}

		if (!user) {
			return next(new WebError(404, "Invalid username or password"));
		}

		res.jsonp({
			token: user.generateBearerToken(config.token.secret, config.token.expiration),
			user: user.toPrivateJSON()
		});
	});
}

function invalidate(req, res, next) {
	if (!req.body.access_token) {
		return next(new WebError(400, "Token is missing"));
	}

	//TODO remove from keystore db and invalidate token
	return res.status(501).jsonp({});
}

function ensure(req, res, next) {
	req.server.secure.authenticate("bearer", {
		session: false
	})(req, res, next);
}

function ensureWithSession(req, res, next) {
	if (req.isAuthenticated() === true) {
		return next(); // already authenticated via session cookie
	}

	req.server.secure.authenticate("bearer", {
		session: false
	})(req, res, next);
}

function tryEnsure(req, res, next) {
	req.server.secure.authenticate(["bearer", "anonymous"], {
		session: false
	})(req, res, next);
}

Object.defineProperty(exports, "__esModule", {
	value: true
});