'use strict';

var express = require('express'),
	compression = require('compression'),
	favicon = require('static-favicon'),
	cookieParser = require('cookie-parser'),
	session = require('express-session'),
	bodyParser = require('body-parser'),
	methodOverride = require('method-override'),
	responseTime = require('response-time'),
	timeout = require('connect-timeout'),
	morgan = require('morgan'),
	Route = require('./../route'),
	
	req = require('express/lib/request'),
	consolidate = require('consolidate'),
	MongoStore = require('connect-mongo')(session),
	flash = require('connect-flash'),
	controllers = require('./../controllers'),
	swig = require('./swig');


var prepareLog = exports.prepareLog = function (app, server) {
	var config = server.config;

	if(config.server.compress) {
		app.use(compression());
	}

	if (config.log.on) {
		app.set('showStackError', config.log.showStackError);
		app.use(morgan(config.log.format, config.log.options));
	}
};

var prepareEngine = exports.prepareEngine = function (app, server) {
	var config = server.config;

	app.locals.pretty = true;
	app.locals.cache = 'memory';
	app.enable('jsonp callback');

	app.engine('html', consolidate[config.view.engine]);
	app.set('view engine', 'html');
	app.set('views', config.server.root + '/views');
};

var prepareHtml = exports.prepareHtml = function (app, server) {
	var config = server.config;

	if(!config.powered.enabled) {
		app.disable('x-powered-by');
	}
	
	if(config.responseTime.enabled) {
		app.use(responseTime(config.responseTime.options));
	}

	if(config.server.timeout) {
		app.use(timeout(config.server.timeout));
	}
	
	if(config.cookieParser.enabled) {
		app.use(cookieParser(config.cookieParser.secret, config.cookieParser.options));
	}

	if(config.bodyParser.length) {
		for(var i=0; i<config.bodyParser.length; i++) {
			var bp = config.bodyParser[i];
			app.use(bodyParser[bp.parse](bp.options));
		}
	}

	if(config.methodOverride.enabled) {
		app.use(methodOverride(config.methodOverride.getter, config.methodOverride.options));
	}
};

var prepareVars = exports.prepareVars = function (app, server) {
	var config = server.config;

	//add access to req from template
	app.use(function(req, res, next) {
		res.locals._req = req;
		res.locals._production = process.env.NODE_ENV === 'production';
		res.locals._build = config.server.build;
		next();
	});

	//add access to req from template
	app.use(function(req, res, next) {
		req.objects = {};
		req.server = server;
		req.models = server.models;
		next();
	});
};

var prepareSession = exports.prepareSession = function (app, server) {
	var config = server.config;

	// Express/Mongo session storage
	var sessionStoreOptions = config.sessionStore;
	sessionStoreOptions.mongoose_connection = server.db;

	var data = config.session;
	data.store = new MongoStore(sessionStoreOptions)	

	app.use(session(data));
};

var prepareSecure = exports.prepareSecure = function (app, server) {
	var config = server.config;

	//prepare secure
	app.use(server.secure.initialize());
	app.use(server.secure.session());
};

var prepareStatic = exports.prepareStatic = function (app, server) {
	var config = server.config;

	app.use(flash());
	app.use(favicon(config.server.root + '/public/favicon.ico'));

	if(config.css.preprocessor) {
		app.use('/public', config.css.preprocessor(server));	
	}
	
	app.use('/public', express.static(config.server.root + '/public'));	
};

var prepareRoute = exports.prepareRoute = function (app, server) {
	var config = server.config;

	//prepare routes
	app.use(Route.basic);

	//at the end add 500 and 404
	app.use(controllers.page.notFound);
	app.use(controllers.page.error);
};

var prepareRequest = function(req) {
	/*extend express request*/
	req.__defineGetter__('port', function(){
		var trustProxy = this.app.get('trust proxy');
		var host = trustProxy && this.get('X-Forwarded-Host');
		host = host || this.get('Host');
		if (!host) {
			return;
		}

		var parts = host.split(':');
		return (parts.length === 2)
			? parseInt(parts[1], 10) 
			: 80;
	});

	req.__defineGetter__('httpHost', function() {
		var trustProxy = this.app.get('trust proxy');
		var host = trustProxy && this.get('X-Forwarded-Host');
		return host || this.get('Host');
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
};

prepareRequest(req);

exports.prepare = function(server) {
	var config = server.config;
	var app = express();

	prepareLog(app, server);
	prepareEngine(app, server);
	prepareHtml(app, server);
	prepareVars(app, server);
	prepareSession(app, server);
	prepareSecure(app, server);
	prepareStatic(app, server);
	prepareRoute(app, server);

	return app;
};