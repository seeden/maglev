export function or(fn1, fn2) {
  return function(req, res, next) {
    fn1(req, res, function(err) {
      if (!err) {
        return next();
      }

      fn2(req, res, next);
    });
  };
}

export function and(fn1, fn2) {
  return function(req, res, next) {
    fn1(req, res, function(err) {
      if (!err) {
        return next(err);
      }

      fn2(req, res, next);
    });
  };
}

export function cond(condition, fnOK, fnElse) {
  return function(req, res, next) {
    condition(req, res, function(err) {
      if (!err) {
        return fnOK(req, res, next);
      }

      fnElse(req, res, next);
    });
  };
}
