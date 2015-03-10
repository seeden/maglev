import express from 'express';
import debug from 'debug';
import http from 'http';

import compression from 'compression';
import serveFavicon from 'serve-favicon';
import serveStatic from 'serve-static';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import responseTime from 'response-time';
import timeout from 'connect-timeout';
import morgan from 'morgan';
import cors from 'cors';
import lessMiddleware from 'less-middleware';
	
import req from 'express/lib/request';
import consolidate from 'consolidate';
import flash from 'connect-flash';


import * as fileController from './controllers/file';
import * as pageController from './controllers/page';

const log = debug('maglev:app');

export default class App {
	constructor(server, options) {
		options = options || {};

		this._server = server;
		this._options = options;
		this._expressApp = express();
		this._httpServer = null;

		this._prepareCompression();
		this._prepareLog();
		this._prepareEngine();
		this._prepareHtml();
		this._prepareVars();
		this._prepareSession();
		this._prepareSecure();
		this._prepareStatic();
		this._prepareRouter();
	}

	get options() {
		return this._options;
	}

	get server() {
		return this._server;
	}

	get expressApp() {
		return this._expressApp;
	}

	listen(port, host, callback) {
		callback = callback || function() {};

		if(this._httpServer) {
			return callback(new Error('You need to close first'));
		}

		this._httpServer = http.createServer(this.expressApp).listen(port, host, callback);

		log('App started on port ' + port + ' and host ' + host);
		return this;
	}

	close(callback) {
		if(!this._httpServer) {
			return callback(new Error('You need to listen first'));
		}

		this._httpServer.close(callback);
		this._httpServer = null;
		return this;
	}

	_prepareCompression() {
		var app = this.expressApp;
		var options = this.options;

		if(!options.compression) {
			return;
		}

		app.use(compression(options.compression));
	}	

	_prepareLog(server) {
		var app = this.expressApp;
		var options = this.options;

		if (!options.log) {
			return;
		}
		
		app.set('showStackError', true);

		if (!options.morgan) {
			return;
		}		
		app.use(morgan(options.morgan.format, options.morgan.options));
	}

	_prepareEngine() {
		var app = this.expressApp;
		var options = this.options;

		app.locals.pretty = true;
		app.locals.cache = 'memory';
		app.enable('jsonp callback');

		app.engine('html', consolidate[options.view.engine]);

		app.set('view engine', 'html');
		app.set('views', options.root + '/views');
	}

	_prepareHtml() {
		var app = this.expressApp;
		var options = this.options;

		if(!options.powered) {
			app.disable('x-powered-by');
		}
		
		if(options.responseTime) {
			app.use(responseTime(options.responseTime));
		}

		if(options.cors) {
			app.use(cors(options.cors));
		}

		if(options.request.timeout) {
			app.use(timeout(options.request.timeout));
		}
		
		if(options.cookieParser) {
			app.use(cookieParser(options.cookieParser.secret, options.cookieParser.options));
		}

		if(options.bodyParser) {
			for(var i=0; i<options.bodyParser.length; i++) {
				var bp = options.bodyParser[i];
				app.use(bodyParser[bp.parse](bp.options));
			}
		}

		if(options.methodOverride) {
			app.use(methodOverride(options.methodOverride.getter, options.methodOverride.options));
		}
	}

	_prepareVars() {
		var app     = this.expressApp;
		var server  = this.server;
		var options = this.options;

		//add access to req from template
		app.use(function(req, res, next) {
			res.locals._req        = req;
			res.locals._production = process.env.NODE_ENV === 'production';
			res.locals._build      = options.server.build;

			next();
		});

		//add access to req from template
		app.use(function(req, res, next) {
			req.objects = {};
			req.server  = server;
			req.models  = server.models;

			next();
		});
	}	

	_prepareSession() {
		var app = this.expressApp;
		var options = this.options;

		if(!options.session) {
			return;
		}

		app.use(session(options.session));
	}

	_prepareSecure() {
		var app = this.expressApp;
		var server  = this.server;
		var options = this.options;

		app.use(server.secure.passport.initialize());

		if(!options.session) {
			return;
		}

		app.use(server.secure.passport.session());
	}

	_prepareStatic() {
		var app = this.expressApp;
		var options = this.options;

		if(options.flash) {
			app.use(flash());
		}

		if(options.favicon) {
			app.use(serveFavicon(options.favicon.root, options.favicon.options));
		}

		if(options.css) {
			app.use(lessMiddleware(options.css.root, options.css.options));	
		}

		if(options.static) {
			app.use(serveStatic(options.static.root, options.static.options));
		}
	}

	_prepareRouter() {
		var app = this.expressApp;
		var options = this.options;
		var server = this.server;

		//use server router
		app.use(server.router.expressRouter);

		//delete uploaded files
		app.use(fileController.clearAfterError); //error must be first
		app.use(fileController.clear);

		//at the end add 500 and 404
		app.use(options.page.notFound || pageController.notFound);
		app.use(options.page.error || pageController.error);
	}
}

function prepareRequest(req) {
	req.__defineGetter__('httpHost', function() {
		var trustProxy = this.app.get('trust proxy');
		var host = trustProxy && this.get('X-Forwarded-Host');
		return host || this.get('Host');
	});

	req.__defineGetter__('port', function(){
		host = this.httpHost;
		if (!host) {
			return;
		}

		var parts = host.split(':');
		return (parts.length === 2)
			? parseInt(parts[1], 10) 
			: 80;
	});

	req.__defineGetter__('protocolHost', function(){
		return this.protocol + '://' + this.httpHost;
	});

	req.isGuest = function() {
		return (typeof this.user === 'undefined');
	};

	req.can = function(action, resource, cb) {
		var server = this.server;
		var config = server.config;
		var rbac = server.rbac;

		//process guest
		if(this.isGuest()) {
			rbac.can(config.rbac.role.guest, action, resource, cb);
		} else {
			this.user.can(rbac, action, resource, cb);	
		}
	};

	req.hasRole = function(name, cb) {
		var server = this.server;
		var rbac = server.rbac;

		if(this.isGuest()) {
			return cb(null, false);
		}

		this.user.hasRole(rbac, name, cb);
	};
}

prepareRequest(req);