'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.getScope = getScope;
exports.can = can;
exports.addPermission = addPermission;
exports.removePermission = removePermission;
exports.hasRole = hasRole;
exports.setRole = setRole;
exports.removeRole = removeRole;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _webError = require('web-error');

var _webError2 = _interopRequireDefault(_webError);

function getScope(req, res, next) {
  var rbac = req.server.rbac;
  var user = req.user;
  if (!user) {
    return next(new _webError2['default'](401));
  }

  user.getScope(rbac, function (err, scope) {
    if (err) {
      return next(err);
    }

    res.jsonp({
      scope: scope
    });
  });
}

function can(req, res, next) {
  var rbac = req.server.rbac;
  var user = req.user;
  if (!user) {
    return next(new _webError2['default'](401));
  }

  var action = req.body.action;
  var resource = req.body.resource;
  if (!action || !resource) {
    return next(new _webError2['default'](400));
  }

  user.can(rbac, action, resource, function (err, userCan) {
    if (err) {
      return next(err);
    }

    res.jsonp({
      can: userCan
    });
  });
}

function addPermission(req, res, next) {
  var rbac = req.server.rbac;
  var user = req.user;
  if (!user) {
    return next(new _webError2['default'](401));
  }

  var action = req.body.action;
  var resource = req.body.resource;
  if (!action || !resource) {
    return next(new _webError2['default'](400));
  }

  user.addPermission(rbac, action, resource, function (err) {
    if (err) {
      return next(err);
    }

    res.status(204).end();
  });
}

function removePermission(req, res, next) {
  var rbac = req.server.rbac;
  var user = req.user;
  if (!user) {
    return next(new _webError2['default'](401));
  }

  var permissionName = req.body.permissionName;
  if (!permissionName) {
    return next(new _webError2['default'](400));
  }

  user.removePermission(rbac, permissionName, function (err) {
    if (err) {
      return next(err);
    }

    res.status(204).end();
  });
}

function hasRole(req, res, next) {
  var rbac = req.server.rbac;
  var user = req.user;
  if (!user) {
    return next(new _webError2['default'](401));
  }

  var role = req.body.role;
  if (!role) {
    return next(new _webError2['default'](400));
  }

  user.hasRole(rbac, role, function (err, has) {
    if (err) {
      return next(err);
    }

    res.jsonp({
      has: has
    });
  });
}

function setRole(req, res, next) {
  var rbac = req.server.rbac;
  var user = req.user;
  if (!user) {
    return next(new _webError2['default'](401));
  }

  var role = req.body.role;
  if (!role) {
    return next(new _webError2['default'](400));
  }

  user.setRole(rbac, role, function (err) {
    if (err) {
      return next(err);
    }

    res.status(204).end();
  });
}

function removeRole(req, res, next) {
  var user = req.user;
  if (!user) {
    return next(new _webError2['default'](401));
  }

  user.removeRole(function (err) {
    if (err) {
      return next(err);
    }

    res.status(204).end();
  });
}