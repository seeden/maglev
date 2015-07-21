import methods from 'methods';
import express from 'express';

export default class Router {
  constructor(options = {}, parent = null) {
    this._options = options;
    this._expressRouter = express.Router(options);
    this._parent = parent;
  }

  get parent() {
    return this._parent;
  }

  get expressRouter() {
    return this._expressRouter;
  }

  end() {
    return this.parent;
  }

  route(prefix) {
    const router = new Router(this._options, this);
    this.expressRouter.use(prefix, router.expressRouter);
    return router;
  }

  api(prefix) {
    prefix = prefix || this._options.api.path;
    return this.route(prefix);
  }

  param(...args) {
    this.expressRouter.param.apply(this.expressRouter, args);
    return this;
  }
}

methods.forEach(function eachMethod(method) {
  Router.prototype[method] = function methodHandler(...args) {
    const expressRouter = this.expressRouter;
    expressRouter[method].apply(expressRouter, args);
    return this;
  };
});
