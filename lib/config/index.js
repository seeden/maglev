'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var extend = require('node.extend'),
	db = require('./db'),
	passport = require('./passport'),
	mail = require('./mail'),
	express = require('./express'),
	swig = require('./swig');

var base = {
	db: {
		uri: null
	},

	rbac: {
		role: {
			guest: 'guest'
		}
	},
	
	server: {
		build: 1,
		powered: false,
		responseTime: true,
		timeout: 30000,
		compress: true,
		root: null,
		host: process.env.HOST || '127.0.0.1',
		port: process.env.PORT || 4000
	},

	token: {
		secret: null,
		expiration: 60*24*14
	},

	session: {
		maxAge: 60*60*24*2,
		expires: 60*60*24*2,
		secret: null,
		collection: 'sessions'
	},

	view: {
		engine: 'swig'
	},


	mail: {
		type: 'SMTP',
		options: null,

		'default': {
			from: null
		},

		token: {
			secret: null,
			expiration: 60*24
		},

		uri: {
			forgetResponse: '/password/forget/response',
			changePassword: '/password/change'
		}
	},

	api: {
		path: '/api'
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

	//passport sstrategies
	strategies: [passport.localStrategy, 
		passport.bearerStrategy, 
		passport.facebookStrategy, 
		passport.facebookCanvasStrategy
	],

	service: {
		db: db,
		mail: mail,
		passport: passport,
		app: express
	},

	facebook: {
		clientID: null,
		clientSecret: null,
		namespace: null
	}
};

function Config(options) {
	extend(true, this, base, options);
}

Config.prototype.prepareMail = function(server) {
	return this.service.mail.prepare(this, server);
};

Config.prototype.prepareDb = function(server) {
	return this.service.db.prepare(this, server);
};

Config.prototype.preparePassport = function(server) {
	return this.service.passport.prepare(this, server);
};

Config.prototype.prepareApp = function(server) {
	return this.service.app.prepare(this, server);
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