'use strict';

var express = require('express'),
	req = require('express/lib/request'),
	consolidate = require('consolidate'),
	mongoStore = require('connect-mongo')(express),
	flash = require('connect-flash'),
	controllers = require('./../controllers'),
	swig = require('./swig'),
	responseTime = require('response-time'),
	lessMiddleware = require('less-middleware');

/*extend express request*/
req.__defineGetter__('port', function(){
    var trustProxy = this.app.get('trust proxy');
    var host = trustProxy && this.get('X-Forwarded-Host');
    host = host || this.get('Host');
    if (!host) {
    	return;
    }

    var parts = host.split(':');
    return (parts.length === 2) ? parseInt(parts[1]) : 80;
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
	
exports.prepare = function(config, server) {
	var app = express();
	var passport = server.passport;

	app.set('showStackError', true);

	app.locals.pretty = true;
	app.locals.cache = 'memory';
		
	if (process.env.NODE_ENV === 'development') {
		app.use(express.logger('dev'));
	}

	app.engine('html', consolidate[config.view.engine]);
	app.set('view engine', 'html');

	app.set('views', config.server.root + '/views');

	app.enable('jsonp callback');

	if(!config.server.powered) {
		app.disable('x-powered-by');	
	}
	

	app.configure(function() {
		if(!config.server.responseTime) {
			app.use(responseTime());
		}

        //add access to req from template
        app.use(function(req, res, next) {
            res.locals._req = req;
            res.locals._production = process.env.NODE_ENV === 'production';
            res.locals._build = config.server.build;
            next();
        });

        //add access to req from template
        app.use(function(req, res, next) {
            req.server = server;
            req.models = server.models;
            next();
        });

		app.use(express.cookieParser());
		app.use(express.urlencoded());
		app.use(express.json());
		app.use(express.methodOverride());

		// Express/Mongo session storage
		var sessionConfData = {
			secret: config.session.secret,
			store: new mongoStore({
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

		app.use(express.session(sessionConfData));

		//prepare passport
		app.use(passport.initialize());
		app.use(passport.session());

		app.use(flash());
		app.use(express.favicon());

		if(config.server.compress) {
			app.use(express.compress());
		}

		//prepare routes
		app.use(app.router);

		app.use('/public', lessMiddleware({
			src: config.server.root + '/public',
			compress: true,
			debug: true
		}));		
		app.use('/public', express.static(config.server.root + '/public'));

		app.use(controllers.page.error);
		app.use(controllers.page.notFound);
	});

	return app;
};