import WebError from 'web-error';
import ok from 'okay';

/**
 * Return middleware function for permission check
 * @param  {String}  action    Name of action
 * @param  {String}  resource  Name of resource
 * @param  {String}  redirect Url where is user redirected when he has no permissions
 * @param  {Number}  status   Status code of redirect action
 * @return {Function}          Middleware function
 */
export function can(action, resource, redirect, redirectStatus = 302) {
  return (req, res, next) => {
    const server = req.server;
    const options = server.options;
    const rbac = server.rbac;
    const user = req.user;

    const callback = ok(next, (canDoIt) => {
      if (!canDoIt) {
        if (redirect) {
          return res.redirect(redirectStatus, redirect);
        }

        return next(new WebError(401, `You have no access: ${action}_${resource}`));
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
export function hasRole(name, redirect, redirectStatus = 302) {
  return (req, res, next) => {
    const server = req.server;
    const rbac = server.rbac;

    if (!req.user) {
      return next(new WebError(401));
    }

    req.user.hasRole(rbac, name, ok(next, (has) => {
      if (!has) {
        if (redirect) {
          return res.redirect(redirectStatus, redirect);
        }
        return next(new WebError(401));
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
export function isGuest(redirect, redirectStatus = 302) {
  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    if (redirect) {
      return res.redirect(redirectStatus, redirect);
    }

    next(new WebError(401, 'You are not a guest'));
  };
}
