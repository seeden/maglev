import mongoose, { Schema } from 'mongoose';
export const name = 'Article';

export default function createModel(server) {
	var schema = new Schema({
		title: { type: String }
	});

	return server.db.model(name, schema);
};