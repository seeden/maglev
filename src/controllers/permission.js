import WebError from 'web-error';

export function permission(req, res, next, name) {
  const rbac = req.server.rbac;

  if (!name) {
    return next(new WebError(400));
  }

  rbac.getPermissionByName(name, function(err, permission) {
    if (err) {
      return next(err);
    }

    if (!permission) {
      return next(new WebError(404));
    }

    req.objects.permission = permission;
    next();
  });
}


/**
 * Create new permission
 */
export function create(req, res, next) {
  const rbac = req.server.rbac;

  if (!req.body.action || !req.body.resource) {
    return next(new WebError(400, 'Permission action or resource is undefined'));
  }

  rbac.createPermission(req.body.action, req.body.resource, function(err, permission) {
    if (err) {
      return next(err);
    }

    if (!permission) {
      return next(new WebError(400));
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
export function remove(req, res, next) {
  const User = req.models.User;

  if (!req.objects.permission) {
    return next(new WebError(404));
  }

  const permission = req.objects.permission;

  // unassign permission from all users
  User.removePermissionFromCollection(permission.name, function(err) {
    if (err) {
      return next(err);
    }

    permission.remove(function(err2, isDeleted) {
      if (err2) {
        return next(err2);
      }

      if (!isDeleted) {
        return next(new WebError(400));
      }

      return res.status(204).end();
    });
  });
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

  const p = req.objects.permission;

  return res.jsonp({
    permission: {
      action: p.action,
      resource: p.resource,
      name: p.name
    }
  });
}
