"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

/**
 * Handler of errors caused by controllers
 * @param  {Error}   err
 * @param  {Request}  req
 * @param  {Response} res
 * @param  {Function} next
 */
exports.error = error;

/**
 * Handler of not founded pages
 * @param  {Request}  req
 * @param  {Response} res
 */
exports.notFound = notFound;

var WebError = _interopRequire(require("web-error"));

var prettyjson = _interopRequire(require("prettyjson"));

function error(err, req, res, next) {
	var config = req.server.config;

	var error = {
		status: err.status || 500,
		message: err.message || "Internal server error",
		stack: err.stack,
		url: req.originalUrl,
		errors: err.errors || []
	};

	//log errors gte 500
	if (error.status >= 500 && config.log.on && config.log.stream) {
		var data = prettyjson.render(err);
		config.log.stream.write(data + "\n");
	}

	res.status(error.status).format({
		"text/plain": function () {
			res.send(error.message);
		},

		"text/html": function () {
			var view = error.status === 404 ? "error404" : "error";
			res.render(view, error);
		},

		"application/json": function () {
			res.jsonp(error);
		}
	});
}

function notFound(req, res, next) {
	return next(new WebError(404));
}

Object.defineProperty(exports, "__esModule", {
	value: true
});