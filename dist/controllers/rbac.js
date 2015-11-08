'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.can = can;
exports.hasRole = hasRole;
exports.isGuest = isGuest;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _webError = require('web-error');

var _webError2 = _interopRequireDefault(_webError);

var _okay = require('okay');

var _okay2 = _interopRequireDefault(_okay);

/**
 * Return middleware function for permission check
 * @param  {String}  action    Name of action
 * @param  {String}  resource  Name of resource
 * @param  {String}  redirect Url where is user redirected when he has no permissions
 * @param  {Number}  status   Status code of redirect action
 * @return {Function}          Middleware function
 */

function can(action, resource, redirect) {
  var redirectStatus = arguments.length <= 3 || arguments[3] === undefined ? 302 : arguments[3];

  return function (req, res, next) {
    var server = req.server;
    var options = server.options;
    var rbac = server.rbac;
    var user = req.user;

    var callback = (0, _okay2['default'])(next, function (canDoIt) {
      if (!canDoIt) {
        if (redirect) {
          return res.redirect(redirectStatus, redirect);
        }

        return next(new _webError2['default'](401));
      }

      next();
    });

    if (!user) {
      rbac.can(options.rbac.role.guest, action, resource, callback);
    } else {
      user.can(rbac, action, resource, callback);
    }
  };
}

/**
 * Return middleware function for permission check
 * @param  {String}  name   Name of role
 * @param  {String}  redirect Url where is user redirected when he has no permissions
 * @param  {Number}  status   Status code of redirect action
 * @return {Function}       Middleware function
 */

function hasRole(name, redirect) {
  var redirectStatus = arguments.length <= 2 || arguments[2] === undefined ? 302 : arguments[2];

  return function (req, res, next) {
    var server = req.server;
    var rbac = server.rbac;

    if (!req.user) {
      return next(new _webError2['default'](401));
    }

    req.user.hasRole(rbac, name, (0, _okay2['default'])(next, function (has) {
      if (!has) {
        if (redirect) {
          return res.redirect(redirectStatus, redirect);
        }
        return next(new _webError2['default'](401));
      }

      next();
    }));
  };
}

/**
 * Allow only guest user show content
 * @param  {String}  redirect Url where is user redirected when he has no permissions
 * @param  {Number}  status   Status code of redirect action
 * @return {Function} Middleware function
 */

function isGuest(redirect) {
  var redirectStatus = arguments.length <= 1 || arguments[1] === undefined ? 302 : arguments[1];

  return function (req, res, next) {
    if (!req.user) {
      return next();
    }

    if (redirect) {
      return res.redirect(redirectStatus, redirect);
    }

    next(new _webError2['default'](401, 'You are not a guest'));
  };
}