# Maglev (Simple web MVC framework)


[![Quality](https://codeclimate.com/github/seeden/maglev.png)](https://codeclimate.com/github/seeden/maglev/badges)
[![Dependencies](https://david-dm.org/seeden/maglev.png)](https://david-dm.org/seeden/maglev)


Maglev is a simple pre configured server based on [Express](http://expressjs.com/) web framework, [Passport](http://passportjs.org/) authentication middleware and [Mongoose](http://mongoosejs.com/) database layer.
Maglev supports MVC patterns and RESTful routes.


## Install

    $ npm install maglev

## Features

  * Predefined models and controllers (User, Facebook)
  * Extended routing for REST api based on Express
  * Token authentication
  * Session authentication
  * Facebook canvas application support 
  * i18n support (in progress)
  * localisation based on url with canonical (in progress) 
  * [Swig](http://paularmstrong.github.io/swig/) template system with custom helpers

## Usage

    var config = require('./config'),
        Server = require('maglev');
    
    var server = new Server(config);
    server.start();

## Directory Structure

  * *controllers* Contains the controllers that handle requests sent to an application.
  * *models* Contains the models for accessing and storing data in a database.
  * *views* Contains the views and layouts that are rendered by an application.
  * *public* Static files and compiled assets served by the application.

## Configuration

## Models
Define new model

    function prepareSchema (Schema) {
        var schema = new Schema({
            city: { type: String },
            street: { type: String },
            streetNumber: { type: Number }
        });
    
        return schema;
    }
    
    module.exports = function (server, mongoose) {
        return server.db.model('Address', prepareSchema(mongoose.Schema));
    };

Extend from existing model

    var UserMaglev = require('maglev/lib/models/user');
    
    function prepareSchema (Schema) {
        var schema = UserMaglev.prepareSchema(Schema);
    
        schema.add({
            phone: {type: String}     
        });
    
        return schema;
    }
    
    module.exports = function (server, mongoose) {
        return server.db.model('User', prepareSchema(mongoose.Schema));   
    };

## Routes

    var oauth2 = require('maglev/lib/controllers/oauth2');
    
    module.exports = function(route) {
        route.api()
        	.post('/oauth2/token', oauth2.generateToken)
        	.post('/oauth2/invalidate', oauth2.invalidateToken);
    };
    
## Credits

  - [Zlatko Fedor](http://github.com/seeden)

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2014 Zlatko Fedor <[http://www.cherrysro.com/](http://www.cherrysro.com/)>
