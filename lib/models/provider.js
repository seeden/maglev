'use strict';

var name = exports.name = 'Provider';

var genNameUID = exports.genNameUID = function(name, uid) {
	return name + '_' + uid;
};

var createSchema = exports.createSchema = function (Schema) {
	//add properties to schema
	var schema = new Schema({
		name: { type: String, required: true },
		uid: { type: String, required: true },
		name_uid: { type: String, required: true },
		data: {}
	});

	//add preprocess validation
	schema.pre('save', function(next) {
		var user = this;

		// only hash the password if it has been modified (or is new)
		if (this.isModified('name') || this.isModified('uid') || !this.name_uid) {
			this.name_uid = genNameUID(this.name, this.uid);
		} 

		next();
	});

	return schema;
};

exports.createModel = function(db) {
	return db.model(name, createSchema(db.mongoose.Schema));   
};