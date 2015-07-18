import WebError from 'web-error';

export function generateForCurrent(req, res, next) {
  const user = req.user;
  const options = req.server.options;

  if (!user) {
    return next(new WebError(401));
  }

  res.jsonp({
    token: user.generateBearerToken(options.token.secret, options.token.expiration),
    user: user.toPrivateJSON()
  });
}

export function generate(req, res, next) {
  const User = req.models.User;
  const options = req.server.options;

  if (!req.body.username || !req.body.password) {
    return next(new WebError(400, 'One of parameter missing'));
  }

  User.findByUsernamePassword(req.body.username, req.body.password, false, function(err, user) {
    if (err) {
      return next(err);
    }

    if (!user) {
      return next(new WebError(404, 'Invalid username or password'));
    }

    res.jsonp({
      token: user.generateBearerToken(options.token.secret, options.token.expiration),
      user: user.toPrivateJSON()
    });
  });
}

export function invalidate(req, res, next) {
  if (!req.body.access_token) {
    return next(new WebError(400, 'Token is missing'));
  }

  // TODO remove from keystore db and invalidate token
  return res.status(501).jsonp({});
}

export function ensure(req, res, next) {
  req.server.secure.authenticate('bearer', {
    session: false
  })(req, res, next);
}

export function ensureWithSession(req, res, next) {
  if (req.isAuthenticated() === true) {
    return next(); // already authenticated via session cookie
  }

  req.server.secure.authenticate('bearer', {
    session: false
  })(req, res, next);
}

export function tryEnsure(req, res, next) {
  req.server.secure.authenticate(['bearer', 'anonymous'], {
    session: false
  })(req, res, next);
}
