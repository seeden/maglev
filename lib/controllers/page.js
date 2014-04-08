'use strict';

/**
 * Handler of errors caused by controllers
 * @param  {Error}   err
 * @param  {Request}  req
 * @param  {Response} res
 * @param  {Function} next
 */
exports.error = function (err, req, res, next) {
    err.status  = err.status    || 500;
    err.message = err.message   || 'Internal server error';
    err.code    = err.code      || 'INTERNAL_ERROR';

    //console.error(err.stack);

    if (req.xhr) {
        res.jsonp(err.status, err);
    } else {
    	res.render('500', {
    		error: err
    	});
    }
};

/**
 * Handler of not founded pages
 * @param  {Request}  req
 * @param  {Response} res
 */
exports.notFound = function (req, res) {
    if (req.xhr) {
        res.jsonp(404, {
			url: req.originalUrl,
			error: 'Not found'
		});
    } else {
    	res.render('404', {
			url: req.originalUrl
		});
    }
};