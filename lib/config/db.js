'use strict';

var mongoose = require('mongoose');

exports.prepare = function(config, server) {
	var db = mongoose.createConnection(config.db.uri);
	db.mongoose = mongoose;

	return db;
};