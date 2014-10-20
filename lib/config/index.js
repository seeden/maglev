'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var extend = require('node.extend'),
	db = require('./db'),
	rbac = require('./rbac'),
	passport = require('./passport'),
	mail = require('./mail'),
	express = require('./express'),
	route = require('./route'),
	swig = require('./swig'),
	preprocessor = require('./lessmiddleware'),
	mkdirp = require('mkdirp');

var base = {
	db: {
		uri: null,
		prepare: db.prepare
	},

	rbac: {
		prepare: rbac.prepare,
		role: {
			guest: 'guest'
		}
	},

	log: {
		on: process.env.NODE_ENV === 'development',
		showStackError: true,
		format: process.env.NODE_ENV === 'development' ? 'dev' : 'combined',
		options: {
			immediate: false
			//stream: process.stdout
		}
	},
	
	server: {
		prepare: express.prepare,
		build: 1,
		timeout: 30000,
		compress: true,
		root: null,
		host: process.env.HOST || '127.0.0.1',
		port: process.env.PORT || 4000
	},

	powered: {
		enabled: false,
		value: 'Maglev'
	},

	responseTime: {
		enabled: true,
		options: {}
	},

	methodOverride: {
		//https://github.com/expressjs/method-override
		enabled: true,
		getter: 'X-HTTP-Method-Override',
		options: {}
	},

	bodyParser: [{
		parse: 'urlencoded',
		options: {
			extended: true
		}
	}, {
		parse: 'json',
		options: {}
	}, {
		parse: 'json',
		options: {
			type: 'application/vnd.api+json'
		}
	}],

	cookieParser: {
		//https://www.npmjs.org/package/cookie-parser
		enabled: true,
		secret: null,
		options: {}
	},

	token: {
		secret: null,
		expiration: 60*24*14
	},

	secure: {
		prepare: passport.prepare,
		strategies: [passport.localStrategy, 
			passport.bearerStrategy, 
			passport.facebookStrategy, 
			passport.facebookCanvasStrategy,
			passport.anonymousStrategy
		]
	},

	session: {
		secret: null,
		cookie: {
			maxAge: 14 *24 * 60 * 60 * 1000 //2 weeks
		},
		resave: true,
		saveUninitialized: true
	},

	sessionStore: {
		auto_reconnect: true,
		collection: 'sessions'
	},

	view: {
		engine: 'swig'
	},

	mail: {
		prepare: mail.prepare,
		type: 'SMTP',
		options: null,

		'default': {
			from: null
		},

		token: {
			secret: null,
			expiration: 60*24
		}
	},

	route: {
		prepare: route.prepare,
		api: {
			path: '/api'	
		} 
	},

	locale: {
		'default': 'en',
		available: ['en'],
		inUrl: false
	},

	country: {
		'default': null,
		available: [],
		inUrl: false
	},	

	registration: {
		simple: true
	},

	facebook: {
		clientID: null,
		clientSecret: null,
		namespace: null
	},

	css: {
		preprocessor: preprocessor.prepare,
		debug: false,
		compress: true,
		sourceMap: true
	},

	upload: {
    	maxFieldsSize: 2000000,
    	maxFields: 1000,
    	path: null
    },

    createPath: [{
    	path: '/logs'
    }, {
    	path: '/public/files'
    }]
};

function Config(options) {
	extend(true, this, base, options);
}

Config.prototype.init = function(server) {
	//check configuration
	this.validate();

	for(var i=0; i<this.createPath.length; i++) {
		var item = this.createPath[i];

		var path = this.server.root + item.path;
		mkdirp.sync(path, item.opts);
	}
};

Config.prototype.validate = function() {
	if(!this.server.root) {
		throw new Error('Server root directory is undefined.');
	}

	if(!this.db.uri) {
		throw new Error('Database uri is undefined.');
	}

	if(!this.token || !this.token.secret) {
		throw new Error('Token secret is undefined. Please see configuration.');
	}

	if(!this.session || !this.session.secret) {
		throw new Error('Session secret is undefined. Please see configuration.');
	}

	/*
	if(!this.mail || !this.mail.options) {
		throw new Error('Mail options is undefined.');
	}
	*/
};

module.exports = Config;