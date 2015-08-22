import WebError from 'web-error';
import prettyjson from 'prettyjson';
import debug from 'debug';

const log = debug('maglev:pageController');

/**
 * Handler of errors caused by controllers
 * @param  {Error}   err
 * @param  {Request}  req
 * @param  {Response} res
 * @param  {Function} next
 */
export function error(err, req, res, next) {
  const server = req.server;
  const options = server.options;

  log(err);

  err.req = req;
  err.url = req.originalUrl;

  server.emit('err', err);

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
    'text/plain': function sendTextPlain() {
      res.send(errorObj.message);
    },

    'text/html': function sendTextHtml() {
      const view = (errorObj.status === 404) ? 'error404' : 'error';
      res.render(view, errorObj);
    },

    'application/json': function sendJSON() {
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
