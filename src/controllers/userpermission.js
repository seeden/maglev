import WebError from 'web-error';
import ok from 'okay';

export function getScope(req, res, next) {
  const rbac = req.server.rbac;
  const user = req.user;
  if (!user) {
    return next(new WebError(401));
  }

  user.getScope(rbac, ok(next, function(scope) {
    res.jsonp({
      scope: scope
    });
  }));
}

export function can(req, res, next) {
  const rbac = req.server.rbac;
  const user = req.user;
  if (!user) {
    return next(new WebError(401));
  }

  const action = req.body.action;
  const resource = req.body.resource;
  if (!action || !resource) {
    return next(new WebError(400));
  }

  user.can(rbac, action, resource, ok(next, function(userCan) {
    res.jsonp({
      can: userCan
    });
  }));
}

export function addPermission(req, res, next) {
  const rbac = req.server.rbac;
  const user = req.user;
  if (!user) {
    return next(new WebError(401));
  }

  const action = req.body.action;
  const resource = req.body.resource;
  if (!action || !resource) {
    return next(new WebError(400));
  }

  user.addPermission(rbac, action, resource, ok(next, function() {
    res.status(204).end();
  }));
}

export function removePermission(req, res, next) {
  const rbac = req.server.rbac;
  const user = req.user;
  if (!user) {
    return next(new WebError(401));
  }

  const permissionName = req.body.permissionName;
  if (!permissionName) {
    return next(new WebError(400));
  }

  user.removePermission(rbac, permissionName, ok(next, function() {
    res.status(204).end();
  }));
}

export function hasRole(req, res, next) {
  const rbac = req.server.rbac;
  const user = req.user;
  if (!user) {
    return next(new WebError(401));
  }

  const role = req.body.role;
  if (!role) {
    return next(new WebError(400));
  }

  user.hasRole(rbac, role, ok(next, function(has) {
    res.jsonp({
      has: has
    });
  }));
}

export function setRole(req, res, next) {
  const rbac = req.server.rbac;
  const user = req.user;
  if (!user) {
    return next(new WebError(401));
  }

  const role = req.body.role;
  if (!role) {
    return next(new WebError(400));
  }

  user.setRole(rbac, role, ok(next, function() {
    res.status(204).end();
  }));
}

export function removeRole(req, res, next) {
  const user = req.user;
  if (!user) {
    return next(new WebError(401));
  }

  user.removeRole(ok(next, function() {
    res.status(204).end();
  }));
}
