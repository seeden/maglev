import WebError from 'web-error';
import ok from 'okay';

export function role(req, res, next, name) {
  const rbac = req.server.rbac;

  if (!name) {
    return next(new WebError(400));
  }

  rbac.getRole(name, ok(next, function(role) {
    if (!role) {
      return next(new WebError(404));
    }

    req.objects.role = role;
    next();
  }));
}

/**
 * Create new role
 */
export function create(req, res, next) {
  const rbac = req.server.rbac;

  if (!req.body.name) {
    return next(new WebError(400, 'Role name is undefined'));
  }

  rbac.createRole(req.body.name, ok(next, function(role) {
    if (!role) {
      return next(new WebError(400));
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
export function remove(req, res, next) {
  const User = req.models.User;

  if (!req.objects.role) {
    return next(new WebError(404));
  }

  const role = req.objects.role;

  // unassign role from all users
  User.removeRoleFromCollection(role.name, ok(next, function() {
    // remove role from rbac
    role.remove(ok(next, function(isDeleted) {
      if (!isDeleted) {
        return next(new WebError(400));
      }

      return res.status(204).end();
    }));
  }));
}

/**
 * Return true if role exists
 */
export function exists(req, res, next) {
  if (!req.objects.role) {
    return next(new WebError(404));
  }

  return res.status(204).end();
}

/**
 * Get role details
 */
export function get(req, res, next) {
  if (!req.objects.role) {
    return next(new WebError(404));
  }

  const role = req.objects.role;

  return res.jsonp({
    role: {
      name: role.name
    }
  });
}

/**
 * Grant role or permission to the role
 */
export function grant(req, res, next) {
  const rbac = req.server.rbac;

  if (!req.objects.role || !req.body.name) {
    return next(new WebError(400));
  }

  const role = req.objects.role;

  rbac.grantByName(role.name, req.body.name, ok(next, function(isGranted) {
    if (!isGranted) {
      return next(new WebError(400));
    }

    return res.status(204).end();
  }));
}

/**
 * Revoke role or permission to the role
 */
export function revoke(req, res, next) {
  const rbac = req.server.rbac;

  if (!req.objects.role || !req.body.name) {
    return next(new WebError(400));
  }

  const role = req.objects.role;

  rbac.revokeByName(role.name, req.body.name, ok(next, function(isRevoked) {
    if (!isRevoked) {
      return next(new WebError(400));
    }

    return res.status(204).end();
  }));
}
