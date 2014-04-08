'use strict';

var name = exports.name = 'Location';

var schemaData = {
	'type': {
		type: String,
		required: true,
		enum: ['Point', 'LineString', 'Polygon'],
		default: 'Point'
	},
	coordinates: [Number]
};

var createSchema = exports.createSchema = function (Schema) {
	return new Schema(schemaData);
};

exports.createModel = function(db) {
	return db.model(name, createSchema(db.mongoose.Schema));   
};

exports.appendTo = function(schema, fieldName, sparse) {
	sparse = sparse || false;

	var data = {};
	data[fieldName] = {
		type: schemaData,
		index: { 
			type: '2dsphere', 
			sparse: sparse 
		}
	};

	schema.add(data);
	
	return schema;
};