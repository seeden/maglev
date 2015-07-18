'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.permission = permission;
exports.create = create;
exports.remove = remove;
exports.exists = exists;
exports.get = get;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _webError = require('web-error');

var _webError2 = _interopRequireDefault(_webError);

function permission(req, res, next, name) {
  var rbac = req.server.rbac;

  if (!name) {
    return next(new _webError2['default'](400));
  }

  rbac.getPermissionByName(name, function (err, permission) {
    if (err) {
      return next(err);
    }

    if (!permission) {
      return next(new _webError2['default'](404));
    }

    req.objects.permission = permission;
    next();
  });
}

/**
 * Create new permission
 */

function create(req, res, next) {
  var rbac = req.server.rbac;

  if (!req.body.action || !req.body.resource) {
    return next(new _webError2['default'](400, 'Permission action or resource is undefined'));
  }

  rbac.createPermission(req.body.action, req.body.resource, function (err, permission) {
    if (err) {
      return next(err);
    }

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
  });
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
  User.removePermissionFromCollection(permission.name, function (err) {
    if (err) {
      return next(err);
    }

    permission.remove(function (err2, isDeleted) {
      if (err2) {
        return next(err2);
      }

      if (!isDeleted) {
        return next(new _webError2['default'](400));
      }

      return res.status(204).end();
    });
  });
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

  var p = req.objects.permission;

  return res.jsonp({
    permission: {
      action: p.action,
      resource: p.resource,
      name: p.name
    }
  });
}