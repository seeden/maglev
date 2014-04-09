'use strict';

var _ = require('underscore'),
	location = require('./location');

var name = exports.name = 'Address';

var type = exports.type = {
	SHIPPING: 'SHIPPING',
	BILLING: 'BILLING'
};

var schemaData = exports.schemaData = {
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
};

var createSchema = exports.createSchema = function (Schema) {
	var locationSchema = location.createSchema(Schema);

	var schema = new Schema(schemaData);

	//add indexes
	schema.index({ street1: 'text' });
	schema.index({ city: 1 });
	schema.index({ state: 1 });


	return location.appendTo(schema, 'location');
};

var appendTo = exports.appendTo = function(schema, fieldName) {
	var data = {};
	
	data[fieldName] = schemaData;

	schema.add(data);
	
	return schema;
};

var createModel = exports.createModel = function(db) {
	return db.model(name, createSchema(db.mongoose.Schema));   
};