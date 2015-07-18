'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.error = error;
exports.notFound = notFound;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _webError = require('web-error');

var _webError2 = _interopRequireDefault(_webError);

var _prettyjson = require('prettyjson');

var _prettyjson2 = _interopRequireDefault(_prettyjson);

/**
 * Handler of errors caused by controllers
 * @param  {Error}   err
 * @param  {Request}  req
 * @param  {Response} res
 * @param  {Function} next
 */

function error(err, req, res, next) {
  var options = req.server.options;

  var errorObj = {
    status: err.status || 500,
    message: err.message || 'Internal server error',
    stack: err.stack,
    url: req.originalUrl,
    errors: err.errors || []
  };

  if (errorObj.status >= 500 && options.log && options.morgan.options.stream) {
    var data = _prettyjson2['default'].render(err);
    options.morgan.options.stream.write(data + '\n');
  }

  res.status(errorObj.status).format({
    'text/plain': function textPlain() {
      res.send(errorObj.message);
    },

    'text/html': function textHtml() {
      var view = errorObj.status === 404 ? 'error404' : 'error';
      res.render(view, errorObj);
    },

    'application/json': function applicationJson() {
      res.jsonp(errorObj);
    }
  });
}

/**
 * Handler of not founded pages
 * @param  {Request}  req
 * @param  {Response} res
 */

function notFound(req, res, next) {
  return next(new _webError2['default'](404));
}