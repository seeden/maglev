# Maglev (Preconfigured simple NodeJS framework)


[![Quality](https://codeclimate.com/github/seeden/maglev.png)](https://codeclimate.com/github/seeden/maglev/badges)
[![Dependencies](https://david-dm.org/seeden/maglev.png)](https://david-dm.org/seeden/maglev)


Maglev is a simple pre configured server based on [Express](http://expressjs.com/) web framework, [Passport](http://passportjs.org/) authentication middleware and [Mongoose](http://mongoosejs.com/) database layer.
Maglev supports MVC patterns and RESTful routes.


## Install

	$ npm install maglev

## Features

 * Predefined models and controllers (User, Facebook, Location)
 * Extended routing for REST api based on Express
 * Token authentication
 * Session authentication
 * Facebook canvas application support 
 * i18n support (in progress)
 * localisation based on url with canonical (in progress) 
 * [Swig](http://paularmstrong.github.io/swig/) template system with custom helpers

## Usage

	var Server = require('maglev'),
		Config = require('maglev/config');

	var config = {
		server: {
			port: 4000
		},
		facebook: {
			clientID: "Facebook App ID",
			clientSecret: "Facebook App Secret",
			namespace: 'Facebook App Namespace'
		}
	};

	var server = new Server(new Config(config));
	server.start();


## Directory Structure

 * *controllers* Contains the controllers that handle requests sent to an application.
 * *models* Contains the models for accessing and storing data in a database.
 * *views* Contains the views and layouts that are rendered by an application.
 * *public* Static files and compiled assets served by the application.

## Configuration

Minimal configuration example

	var config = {
		db: {
			uri: process.env.NODE_ENV === 'production' ?
				'mongodb://localhost/myproject' :
				'mongodb://localhost/myproject-dev'
		},
			
		server: {
			//path to root directory of your project
			root: __dirname__
		},

		token: {
			secret: 'your secret string for generating of user tokens used for authentication',
		},

		session: {
			secret: 'your secret string for generating of user sessions used for authentication',
		},	

		facebook: {
			clientID: "Facebook App ID",
			clientSecret: "Facebook Secret ID",
			namespace: 'Facebook Namespace'
		}
	};

## Models
Define new model

	var name = exports.name = 'Address';

	var createSchema = exports.createSchema = function (Schema) {
		//add properties to schema
		var schema = new Schema({
			city: { type: String, required: true },
			street: { type: String, required: true },
			state: { type: String, required: true }
		});

		return schema;
	};

	exports.createModel = function(db) {
		return db.model(name, createSchema(db.mongoose.Schema));   
	};

Extend from existing model

	var models = require('maglev/models'),
		address = require('./address');

	var name = exports.name = models.user.name;

	var createSchema = exports.createSchema = function(Schema) {
		var schema = models.user.createSchema(Schema);
		var addressSchema = address.createSchema(Schema);

		schema.add({
			address: addressSchema       
		});
	};

	exports.createModel = function (db) {
		return db.model(name, createSchema(db.mongoose.Schema));   
	};
		

## Routes

	var controllers = require('../controllers');

	var	user = controllers.user,
		token = controllers.maglev.token,
		message = controllers.message;


	module.exports = function(route) {
		route.api()
			.get('/messages', token.ensure, message.get)
			.put('/messages/mark/read/:id', token.ensure, message.markAsRead)
			.put('/messages/mark/unread/:id', token.ensure, message.markAsUnread);
	};


## There are other configuration parameters

	var config = {

			db: {
				uri: null
			},
			
			server: {
				build: 1,
				root: null,
				host: '127.0.0.1',
				port: process.env.PORT || 4000
			},

			token: {
				secret: null,
				expiration: 60*24*14
			},

			session: {
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

			facebook: {
				clientID: null,
				clientSecret: null,
				namespace: null
			}
		};	
		
## Credits

[Zlatko Fedor](http://github.com/seeden)

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2014 Zlatko Fedor [http://www.cherrysro.com/](http://www.cherrysro.com/)