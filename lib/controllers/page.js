'use strict';

var WebError = require('web-error'),
	prettyjson = require('prettyjson');

/**
 * Handler of errors caused by controllers
 * @param  {Error}   err
 * @param  {Request}  req
 * @param  {Response} res
 * @param  {Function} next
 */
exports.error = function (err, req, res, next) {
	var config = req.server.config;

	var error = {
		status: err.status || 500,
		message: err.message || 'Internal server error',
		url: req.originalUrl
	};

	//log errors gte 500
	if(error.status>=500 && config.log.on && config.log.stream) {
		var data = prettyjson.render(err);
		config.log.stream.write(data + "\n");
	}

	res.status(error.status).format({
		'text/plain': function() {
			res.send(error.message);
		},
  
		'text/html': function() {
			var view = (error.status === 404) ? 'error404' : 'error';
			res.render(view, error);
		},
  
		'application/json': function() {
			res.jsonp(error);
		}
	});
};

/**
 * Handler of not founded pages
 * @param  {Request}  req
 * @param  {Response} res
 */
exports.notFound = function (req, res, next) {
	return next(new WebError(404));
};