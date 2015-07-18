import WebError from 'web-error';
import prettyjson from 'prettyjson';

/**
 * Handler of errors caused by controllers
 * @param  {Error}   err
 * @param  {Request}  req
 * @param  {Response} res
 * @param  {Function} next
 */
export function error(err, req, res, next) {
  const options = req.server.options;

  const errorObj = {
    status: err.status || 500,
    message: err.message || 'Internal server error',
    stack: err.stack,
    url: req.originalUrl,
    errors: err.errors || []
  };

  if (errorObj.status >= 500 && options.log && options.morgan.options.stream) {
    const data = prettyjson.render(err);
    options.morgan.options.stream.write(data + '\n');
  }

  res.status(errorObj.status).format({
    'text/plain': function() {
      res.send(errorObj.message);
    },

    'text/html': function() {
      const view = (errorObj.status === 404) ? 'error404' : 'error';
      res.render(view, errorObj);
    },

    'application/json': function() {
      res.jsonp(errorObj);
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
