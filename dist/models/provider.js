'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});
exports.genNameUID = genNameUID;
exports.createSchema = createSchema;
var name = 'Provider';

exports.name = name;
/**
 * Generate provider uid name from provider name and user ID
 * @param  {String} name Provider name
 * @param  {String} uid  User ID
 * @return {String}      Provider UID
 */

function genNameUID(name, uid) {
	return name + '_' + uid;
}

function createSchema(Schema) {
	//add properties to schema
	var schema = new Schema({
		name: { type: String, required: true },
		uid: { type: String, required: true },
		nameUID: { type: String, required: true },
		data: {}
	});

	//add preprocess validation
	schema.pre('save', function (next) {
		var user = this;

		// only hash the password if it has been modified (or is new)
		if (this.isModified('name') || this.isModified('uid') || !this.nameUID) {
			this.nameUID = genNameUID(this.name, this.uid);
		}

		next();
	});

	return schema;
}