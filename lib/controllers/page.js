'use strict';

var WebError = require('web-error');

/**
 * Handler of errors caused by controllers
 * @param  {Error}   err
 * @param  {Request}  req
 * @param  {Response} res
 * @param  {Function} next
 */
exports.error = function (err, req, res, next) {
	var error = {
		status: err.status || 500,
		message: err.message || 'Internal server error',
		url: req.originalUrl
	};

	res.format({
		'text/plain': function() {
			res.send(error.status, error.message);
		},
  
		'text/html': function() {
			var view = (error.status === 404) ? 'error404' : 'error';

			res.status(error.status);
			res.render(view, error);
		},
  
		'application/json': function() {
			res.jsonp(error.status, error);
		}
	});
};

/**
 * Handler of not founded pages
 * @param  {Request}  req
 * @param  {Response} res
 */
exports.notFound = function (req, res, next) {
	next(new WebError(404));
};