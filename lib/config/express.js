'use strict';

var express = require('express'),
	request = require('express/lib/request'),
	consolidate = require('consolidate'),
	mongoStore = require('connect-mongo')(express),
	flash = require('connect-flash'),
	controllers = require('./../controllers'),
	swig = require('./swig'),
	responseTime = require('response-time'),
	lessMiddleware = require('less-middleware');

/*extend express request*/
request.__defineGetter__('port', function(){
    var trustProxy = this.app.get('trust proxy');
    var host = trustProxy && this.get('X-Forwarded-Host');
    host = host || this.get('Host');
    if (!host) return;

    var parts = host.split(':');
    return (parts.length === 2) ? parseInt(parts[1]) : 80;
});

request.__defineGetter__('httpHost', function() {
    var trustProxy = this.app.get('trust proxy');
    var host = trustProxy && this.get('X-Forwarded-Host');
    return host || this.get('Host');
});

request.__defineGetter__('protocolHost', function(){
    return this.protocol + '://' + this.httpHost;
});

request.model = function(name) {
	return this._server.model(name);
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
	app.disable('x-powered-by');

	app.configure(function() {
		app.use(responseTime());

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
		app.use(express.session({
			secret: config.session.secret,
			maxAge: new Date(Date.now() + 60*60*24*2*1000), //2 days
			expires: new Date(Date.now() + 60*60*24*2*1000), //2 days
			cookie  : {
				maxAge  : new Date(Date.now() + 60*60*24*1000) //1 day
			},
			store: new mongoStore({
				auto_reconnect: true,
				mongoose_connection: server.db,
				collection: config.session.collection
			})
		}));

		app.use(passport.initialize());
		app.use(passport.session());

		app.use(flash());
		app.use(express.favicon());

		app.use(express.compress());

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