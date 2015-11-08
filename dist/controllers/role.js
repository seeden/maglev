'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.loadRole = loadRole;
exports.create = create;
exports.remove = remove;
exports.exists = exists;
exports.get = get;
exports.grant = grant;
exports.revoke = revoke;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _webError = require('web-error');

var _webError2 = _interopRequireDefault(_webError);

var _okay = require('okay');

var _okay2 = _interopRequireDefault(_okay);

function loadRole(req, res, next, name) {
  var rbac = req.server.rbac;

  if (!name) {
    return next(new _webError2['default'](400));
  }

  rbac.getRole(name, (0, _okay2['default'])(next, function (role) {
    if (!role) {
      return next(new _webError2['default'](404));
    }

    req.objects.role = role;
    next();
  }));
}

/**
 * Create new role
 */

function create(req, res, next) {
  var rbac = req.server.rbac;

  if (!req.body.name) {
    return next(new _webError2['default'](400, 'Role name is undefined'));
  }

  rbac.createRole(req.body.name, (0, _okay2['default'])(next, function (role) {
    if (!role) {
      return next(new _webError2['default'](400));
    }

    return res.jsonp({
      role: {
        name: role.name
      }
    });
  }));
}

/**
 * Remove existing role
 */

function remove(req, res, next) {
  var User = req.models.User;

  if (!req.objects.role) {
    return next(new _webError2['default'](404));
  }

  var role = req.objects.role;

  // unassign role from all users
  User.removeRoleFromCollection(role.name, (0, _okay2['default'])(next, function () {
    // remove role from rbac
    role.remove((0, _okay2['default'])(next, function (isDeleted) {
      if (!isDeleted) {
        return next(new _webError2['default'](400));
      }

      return res.status(204).end();
    }));
  }));
}

/**
 * Return true if role exists
 */

function exists(req, res, next) {
  if (!req.objects.role) {
    return next(new _webError2['default'](404));
  }

  return res.status(204).end();
}

/**
 * Get role details
 */

function get(req, res, next) {
  if (!req.objects.role) {
    return next(new _webError2['default'](404));
  }

  var role = req.objects.role;

  return res.jsonp({
    role: {
      name: role.name
    }
  });
}

/**
 * Grant role or permission to the role
 */

function grant(req, res, next) {
  var rbac = req.server.rbac;

  if (!req.objects.role || !req.body.name) {
    return next(new _webError2['default'](400));
  }

  var role = req.objects.role;

  rbac.grantByName(role.name, req.body.name, (0, _okay2['default'])(next, function (isGranted) {
    if (!isGranted) {
      return next(new _webError2['default'](400));
    }

    return res.status(204).end();
  }));
}

/**
 * Revoke role or permission to the role
 */

function revoke(req, res, next) {
  var rbac = req.server.rbac;

  if (!req.objects.role || !req.body.name) {
    return next(new _webError2['default'](400));
  }

  var role = req.objects.role;

  rbac.revokeByName(role.name, req.body.name, (0, _okay2['default'])(next, function (isRevoked) {
    if (!isRevoked) {
      return next(new _webError2['default'](400));
    }

    return res.status(204).end();
  }));
}