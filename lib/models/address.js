'use strict';

var _ = require('underscore'),
	location = require('./location');

var name = exports.name = 'Address';

var type = exports.type = {
	SHIPPING: 'SHIPPING',
	BILLING: 'BILLING'
};

var createSchema = exports.createSchema = function (Schema) {
	var locationSchema = location.createSchema(Schema);

	var schema = new Schema({
		street1 	: { type: String, required: true },
		street2 	: { type: String },
		city 		: { type: String, required: true },
		state 		: { type: String, required: true }, //TEXAS
		zip 		: { type: String },
		country     : { type: String }, //USA

		created 	: { type: Date, default: Date.now },
		updated 	: { type: Date, default: Date.now },
		primary     : { type: Boolean, default: false },
		type     	: { type: String, enum: _.values(type) }
	});

	//add indexes
	schema.ensureIndex({ street1: 'text' });
	schema.ensureIndex({ city: 1 });
	schema.ensureIndex({ state: 1 });

	return location.appendTo(schema, 'location');
};

var createModel = exports.createModel = function(db) {
	return db.model(name, createSchema(db.mongoose.Schema));   
};