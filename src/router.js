import methods from 'methods';
import express from 'express';

export default class Router {
	constructor (options, parent) {
		options = options || {};

		this._options = options;
		this._expressRouter = express.Router(options);
		this._parent = parent || null;
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
		var router = new Router(this._options, this);
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

methods.forEach(function(method) {
	Router.prototype[method] = function(...args) {
		var expressRouter = this.expressRouter;
		expressRouter[method].apply(expressRouter, args);	
		return this;
	};
});