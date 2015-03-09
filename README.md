# Maglev (Preconfigured simple NodeJS framework)


[![Quality](https://codeclimate.com/github/seeden/maglev.png)](https://codeclimate.com/github/seeden/maglev/badges)
[![Dependencies](https://david-dm.org/seeden/maglev.png)](https://david-dm.org/seeden/maglev)
[![Gitter chat](https://badges.gitter.im/seeden/maglev.png)](https://gitter.im/seeden/maglev)
[![Gittip](https://img.shields.io/gittip/seeden.svg?style=flat)](https://gratipay.com/seeden/)


Maglev is a simple pre configured server based on [Express](http://expressjs.com/) web framework, [Passport](http://passportjs.org/) authentication middleware and [Mongoose](http://mongoosejs.com/) database layer.
Maglev supports MVC patterns and RESTful routes.


## Install

	$ npm install maglev

## Features

 * Predefined models and controllers (User, Token, Role, Permission, Logic...)
 * Extended routing for REST api based on Express
 * Token and session authentication
 * Role based access system
 * [Swig](http://paularmstrong.github.io/swig/) template system with custom helpers

## Usage
	var mongoose = require('mongoose');
	var Server = require('maglev');

	var server = new Server({
		db: mongoose.connect('mongodb://localhost/project-name'),
		server: {
			root: __dirname
		}
	});

	server.start();


## Directory Structure

 * *controllers* Contains the controllers that handle requests sent to an application.
 * *models* Contains the models for accessing and storing data in a database.
 * *views* Contains the views and layouts that are rendered by an application.
 * *public* Static files and compiled assets served by the application.

## Models
Define new model

	var mongoose = require('mongoose');
	var Schema = mongoose.Schema;

	function createSchema() {
		var schema = new Schema({
			city: { type: String, required: true },
			street: { type: String, required: true },
			state: { type: String, required: true }
		});

		return schema;
	}

	module.exports = function (server) {
		return server.db.model('Address', createSchema());   
	};

## Routes

	var token = require('maglev/dist/controllers/token');
	var message = require('../controllers/message');

	module.exports = function(route) {
		route
			.api()
			.get('/messages', token.ensure, message.get)
			.put('/messages/mark/read/:id', token.ensure, message.markAsRead)
			.put('/messages/mark/unread/:id', token.ensure, message.markAsUnread);
	};


## There are other configuration parameters

	var config = {
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
			strategies: [
				passport.localStrategy, 
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
			autoReconnect: true,
			collection: 'sessions'
		},

		view: {
			engine: 'swig'
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
	    }],

	    page: {
	    	error: page.error,
	    	notFound: page.notFound
	    }
	};
		
## Credits

[Zlatko Fedor](http://github.com/seeden)

## License

The MIT License (MIT)

Copyright (c) 2015 Zlatko Fedor zlatkofedor@cherrysro.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.