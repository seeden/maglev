"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

exports.isOwner = isOwner;
exports.user = user;
exports.permalink = permalink;

/**
 * Create user by simple registraion
 */
exports.create = create;
exports.remove = remove;
exports.current = current;

var WebError = _interopRequire(require("web-error"));

var tv4 = _interopRequire(require("tv4"));

function isOwner(req, res, next) {
	if (!req.user || !req.objects.user) {
		return next(new WebError(401));
	}

	if (!req.user.isMe(req.objects.user)) {
		return next(new WebError(401));
	}

	next();
}

function user(req, res, next, id) {
	var User = req.models.User;

	if (!id) {
		return next(new WebError(400));
	}

	User.findById(id, function (err, user) {
		if (err) {
			return next(err);
		}

		if (!user) {
			return next(new WebError(404));
		}

		req.objects.user = user;
		next();
	});
}

function permalink(req, res, next, permalink) {
	var User = req.models.User;

	if (!permalink) {
		return next(new WebError(400));
	}

	User.findOne({
		permalink: permalink
	}, function (err, user) {
		if (err) {
			return next(err);
		}

		if (!user) {
			return next(new WebError(404));
		}

		req.objects.user = user;
		next();
	});
}

function create(req, res, next) {
	var User = req.models.User;
	var options = req.server.options;

	exports.createSchema = exports.createSchema || User.getRestJSONSchema();
	var result = tv4.validateMultiple(req.body, exports.createSchema);
	if (!result.valid) {
		return next(new WebError(400, "Validation errors", result.errors));
	}

	User.create(req.body, function (err, user) {
		if (err) {
			return next(err);
		}

		if (!user) {
			return next(new Error("User is undefined"));
		}

		res.jsonp({
			token: user.generateBearerToken(options.token.secret, options.token.expiration),
			user: user.toPrivateJSON()
		});
	});
}

function remove(req, res, next) {
	var user = req.objects.user;

	if (!user) {
		return next(new WebError(404));
	}

	user.remove(function (err) {
		if (err) {
			return next(err);
		}

		res.status(204).jsonp({});
	});
}

function current(req, res, next) {
	var user = req.user;

	if (!user) {
		return next(new WebError(404));
	}

	res.jsonp({
		user: user.toPrivateJSON()
	});
}

Object.defineProperty(exports, "__esModule", {
	value: true
});