import mongoose, { Schema } from 'mongoose';

export const name = 'Provider';

/**
 * Generate provider uid name from provider name and user ID
 * @param  {String} name Provider name
 * @param  {String} uid  User ID
 * @return {String}      Provider UID
 */
export function genNameUID(name, uid) {
	return name + '_' + uid;
}

export function createSchema() {
	//add properties to schema
	var schema = new Schema({
		name 	: { type: String, required: true },
		uid 	: { type: String, required: true },
		nameUID : { type: String, required: true },
		data 	: {}
	});

	//add preprocess validation
	schema.pre('save', function(next) {
		var user = this;

		// only hash the password if it has been modified (or is new)
		if (this.isModified('name') || this.isModified('uid') || !this.nameUID) {
			this.nameUID = genNameUID(this.name, this.uid);
		} 

		next();
	});

	return schema;
}

export default function createModel (server) {
	return server.db.model(name, createSchema());   
}
