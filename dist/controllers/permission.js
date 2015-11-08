'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.loadPermission = loadPermission;
exports.create = create;
exports.remove = remove;
exports.exists = exists;
exports.get = get;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _webError = require('web-error');

var _webError2 = _interopRequireDefault(_webError);

var _okay = require('okay');

var _okay2 = _interopRequireDefault(_okay);

function loadPermission(req, res, next, name) {
  var rbac = req.server.rbac;

  if (!name) {
    return next(new _webError2['default'](400));
  }

  rbac.getPermissionByName(name, (0, _okay2['default'])(next, function (permission) {
    if (!permission) {
      return next(new _webError2['default'](404));
    }

    req.objects.permission = permission;
    next();
  }));
}

/**
 * Create new permission
 */

function create(req, res, next) {
  var rbac = req.server.rbac;

  if (!req.body.action || !req.body.resource) {
    return next(new _webError2['default'](400, 'Permission action or resource is undefined'));
  }

  rbac.createPermission(req.body.action, req.body.resource, (0, _okay2['default'])(next, function (permission) {
    if (!permission) {
      return next(new _webError2['default'](400));
    }

    return res.jsonp({
      permission: {
        action: permission.action,
        resource: permission.resource,
        name: permission.name
      }
    });
  }));
}

/**
 * Remove existing permission
 */

function remove(req, res, next) {
  var User = req.models.User;

  if (!req.objects.permission) {
    return next(new _webError2['default'](404));
  }

  var permission = req.objects.permission;

  // unassign permission from all users
  User.removePermissionFromCollection(permission.name, (0, _okay2['default'])(next, function () {
    permission.remove((0, _okay2['default'])(next, function (isDeleted) {
      if (!isDeleted) {
        return next(new _webError2['default'](400));
      }

      return res.status(204).end();
    }));
  }));
}

/**
 * Return true if poermission exists
 */

function exists(req, res, next) {
  if (!req.objects.permission) {
    return next(new _webError2['default'](404));
  }

  return res.status(204).end();
}

/**
 * Get permission details
 */

function get(req, res, next) {
  if (!req.objects.permission) {
    return next(new _webError2['default'](404));
  }

  var perm = req.objects.permission;

  return res.jsonp({
    permission: {
      action: perm.action,
      resource: perm.resource,
      name: perm.name
    }
  });
}