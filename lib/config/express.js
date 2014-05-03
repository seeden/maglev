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
		var role = rbac.getRole(config.rbac.role.guest);
		rbac.can(role, action, resource, cb);
	} else {
		this.user.can(rbac, action, resource, cb);	
	}
};

req.hasRole = function(name, cb) {
	var server = this.server;
	var config = server.config;
	var rbac = server.rbac;

	if(this.isGuest()) {
		return cb(null, false);
	}

	this.user.hasRole(rbac, name, cb);
};
	
exports.prepare = function(server) {
	var config = server.config;
	var app = express();

	if (process.env.NODE_ENV === 'development') {
		app.set('showStackError', true);
		app.use(morgan('dev'));
	}

	app.locals.pretty = true;
	app.locals.cache = 'memory';
	app.enable('jsonp callback');

	app.engine('html', consolidate[config.view.engine]);
	app.set('view engine', 'html');
	app.set('views', config.server.root + '/views');

	if(!config.server.powered) {
		app.disable('x-powered-by');	
	}
	
	if(config.server.responseTime) {
		app.use(responseTime());
	}

	if(config.server.timeout) {
		app.use(timeout(config.server.timeout));
	}
	
	app.use(cookieParser());
	app.use(bodyParser());
	app.use(methodOverride());

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

	// Express/Mongo session storage
	var sessionConfData = {
		secret: config.session.secret,
		store: new MongoStore({
			auto_reconnect: true,
			mongoose_connection: server.db,
			collection: config.session.collection
		})	
	}; 

	if(config.session.maxAge !== false) {
		sessionConfData.maxAge = new Date(Date.now() + config.session.maxAge*1000);	
		sessionConfData.cookie = {
			maxAge  : new Date(Date.now() + config.session.maxAge*1000) //1 day
		};
	}

	if(config.session.expires !== false) {
		sessionConfData.expires = new Date(Date.now() + config.session.expires*1000);	
	}

	app.use(session(sessionConfData));

	//prepare secure
	app.use(server.secure.initialize());
	app.use(server.secure.session());

	app.use(flash());
	app.use(favicon(config.server.root + '/public/favicon.ico'));

	if(config.server.compress) {
		app.use(compression());
	}

	if(config.css.preprocessor) {
		app.use('/public', config.css.preprocessor(server));	
	}
	
	app.use('/public', express.static(config.server.root + '/public'));	

	//prepare routes
	app.use(Route.basic);

	//at the end add 500 and 404
	app.use(controllers.page.error);
	app.use(controllers.page.notFound);

	return app;
};