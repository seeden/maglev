import WebError from 'web-error';
import ok from 'okay';

export function loadPermission(req, res, next, name) {
  const rbac = req.server.rbac;

  if (!name) {
    return next(new WebError(400));
  }

  rbac.getPermissionByName(name, ok(next, (permission) => {
    if (!permission) {
      return next(new WebError(404));
    }

    req.objects.permission = permission;
    next();
  }));
}

/**
 * Create new permission
 */
export function create(req, res, next) {
  const rbac = req.server.rbac;

  if (!req.body.action || !req.body.resource) {
    return next(new WebError(400, 'Permission action or resource is undefined'));
  }

  rbac.createPermission(req.body.action, req.body.resource, ok(next, (permission) => {
    if (!permission) {
      return next(new WebError(400));
    }

    return res.jsonp({
      permission: {
        action: permission.action,
        resource: permission.resource,
        name: permission.name,
      },
    });
  }));
}

/**
 * Remove existing permission
 */
export function remove(req, res, next) {
  const User = req.models.User;

  if (!req.objects.permission) {
    return next(new WebError(404));
  }

  const permission = req.objects.permission;

  // unassign permission from all users
  User.removePermissionFromCollection(permission.name, ok(next, () => {
    permission.remove(ok(next, (isDeleted) => {
      if (!isDeleted) {
        return next(new WebError(400));
      }

      return res.status(204).end();
    }));
  }));
}

/**
 * Return true if poermission exists
 */
export function exists(req, res, next) {
  if (!req.objects.permission) {
    return next(new WebError(404));
  }

  return res.status(204).end();
}

/**
 * Get permission details
 */
export function get(req, res, next) {
  if (!req.objects.permission) {
    return next(new WebError(404));
  }

  const perm = req.objects.permission;

  return res.jsonp({
    permission: {
      action: perm.action,
      resource: perm.resource,
      name: perm.name,
    },
  });
}
