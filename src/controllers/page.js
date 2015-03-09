import WebError from 'web-error';
import prettyjson from 'prettyjson';

/**
 * Handler of errors caused by controllers
 * @param  {Error}   err
 * @param  {Request}  req
 * @param  {Response} res
 * @param  {Function} next
 */
export function error (err, req, res, next) {
	var options = req.server.options;

	var error = {
		status: err.status || 500,
		message: err.message || 'Internal server error',
		stack: err.stack,
		url: req.originalUrl,
		errors: err.errors || []
	};

	if(error.status>=500 && options.log && options.morgan.options.stream) {
		var data = prettyjson.render(err);
		options.morgan.options.stream.write(data + "\n");
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
}

/**
 * Handler of not founded pages
 * @param  {Request}  req
 * @param  {Response} res
 */
export function notFound(req, res, next) {
	return next(new WebError(404));
}