import WebError from 'web-error';
import RedirectCode from '../constants/RedirectCode';

export { RedirectCode };

export function restrictTo(domain, code = RedirectCode.TEMPORARY) {
  return (req, res, next) => {
    if (req.hostname === domain) {
      return next();
    }

    const newUrl = `${req.protocol}://${domain}${req.originalUrl}`;
    res.redirect(code, newUrl);
  };
}

export function restrictPath(domain, path) {
  return (req, res, next) => {
    if (req.hostname !== domain) {
      return next();
    }

    if (path instanceof RegExp && path.test(req.path)) {
      return next();
    }

    if (path === req.path) {
      return next();
    }

    next(new WebError(404));
  };
}
