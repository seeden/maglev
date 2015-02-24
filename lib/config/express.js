'use strict';

var express = require('express');
var compression = require('compression');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var responseTime = require('response-time');
var timeout = require('connect-timeout');
var morgan = require('morgan');
var Route = require('./../route');
var cors = require('cors');
	
var req = require('express/lib/request');
var consolidate = require('consolidate');
var MongoStore = require('connect-mongo')(session);
var flash = require('connect-flash');
var controllers = require('./../controllers');
var swig = require('./swig');


function prepareLog(app, server) {
	var config = server.config;

	if(config.server.compress) {
		app.use(compression());
	}

	if (config.log.on) {
		app.set('showStackError', config.log.showStackError);
		app.use(morgan(config.log.format, config.log.options));
	}
}

function prepareEngine(app, server) {
	var config = server.config;

	app.locals.pretty = true;
	app.locals.cache = 'memory';
	app.enable('jsonp callback');

	app.engine('html', consolidate[config.view.engine]);
	app.set('view engine', 'html');
	app.set('views', config.server.root + '/views');
}

function prepareHtml(app, server) {
	var config = server.config;

	if(!config.powered.enabled) {
		app.disable('x-powered-by');
	}
	
	if(config.responseTime.enabled) {
		app.use(responseTime(config.responseTime.options));
	}

	if(config.cors) {
		app.use(cors(config.cors));
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
}

function prepareVars(app, server) {
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
}

function prepareSession(app, server) {
	var config = server.config;

	// Express/Mongo session storage
	var sessionStoreOptions = config.sessionStore;
	sessionStoreOptions.mongooseConnection = server.db;

	var data = config.session;
	data.store = new MongoStore(sessionStoreOptions)	

	app.use(session(data));
}

function prepareSecure(app, server) {
	var config = server.config;

	//prepare secure
	app.use(server.secure.initialize());
	app.use(server.secure.session());
}

function prepareStatic(app, server) {
	var config = server.config;

	app.use(flash());
	app.use(favicon(config.server.root + '/public/favicon.ico'));

	if(config.css.preprocessor) {
		app.use('/public', config.css.preprocessor(server));	
	}
	
	app.use('/public', express.static(config.server.root + '/public'));	
}

function prepareRoute(app, server) {
	var config = server.config;

	//prepare routes
	app.use(Route.basic);

	//delete uploaded files
	app.use(controllers.file.clearAfterError); //error must be first
	app.use(controllers.file.clear);

	//at the end add 500 and 404
	app.use(config.page.notFound || controllers.page.notFound);
	app.use(config.page.error || controllers.page.error);
}

function prepareRequest(req) {
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
}

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