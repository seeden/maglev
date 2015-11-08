import WebError from 'web-error';
import tv4 from 'tv4';
import ok from 'okay';

export function isOwner(req, res, next) {
  if (!req.user || !req.objects.user) {
    return next(new WebError(401));
  }

  if (!req.user.isMe(req.objects.user)) {
    return next(new WebError(401));
  }

  next();
}

export function loadByID(req, res, next, id) {
  const User = req.models.User;

  if (!id) {
    return next(new WebError(400));
  }

  User.findById(id, ok(next, (user) => {
    if (!user) {
      return next(new WebError(404));
    }

    req.objects.user = user;
    next();
  }));
}

export function loadByPermalink(req, res, next, permalink) {
  const User = req.models.User;

  if (!permalink) {
    return next(new WebError(400));
  }

  User.findOne({
    permalink,
  }, ok(next, (user) => {
    if (!user) {
      return next(new WebError(404));
    }

    req.objects.user = user;
    next();
  }));
}

/**
 * Create user by simple registraion
 */
export function create(req, res, next) {
  const User = req.models.User;
  const options = req.server.options;

  exports.createSchema = exports.createSchema || User.getRestJSONSchema();
  const result = tv4.validateMultiple(req.body, exports.createSchema);
  if (!result.valid) {
    return next(new WebError(400, 'Validation errors', result.errors));
  }

  User.create(req.body, ok(next, (user) => {
    if (!user) {
      return next(new Error('User is undefined'));
    }

    res.jsonp({
      token: user.generateBearerToken(options.token.secret, options.token.expiration),
      user: user.toPrivateJSON(),
    });
  }));
}

export function remove(req, res, next) {
  const user = req.objects.user;
  if (!user) {
    return next(new WebError(404));
  }

  user.remove(ok(next, () => {
    res.status(204).end();
  }));
}

export function current(req, res, next) {
  const user = req.user;
  if (!user) {
    return next(new WebError(404));
  }

  res.jsonp({
    user: user.toPrivateJSON(),
  });
}
