import RedirectCode from '../constants/RedirectCode';

export { RedirectCode };

/*
  /^\/(en|sk|it)(\/.*)/
  to '$2'
*/
export function regExpPath(pathRegExp, to, code = RedirectCode.TEMPORARY) {
  if (!(pathRegExp instanceof RegExp)) {
    throw new Error('Path is not regexp');
  }

  return (req, res, next) => {
    if (!pathRegExp.test(req.path)) {
      return next();
    }

    const newPath = req.path.replace(pathRegExp, to);

    res.redirect(newPath, code);
  };
}
