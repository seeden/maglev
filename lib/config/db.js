'use strict';

var mongoose = require('mongoose');

exports.prepare = function(server) {
	var config = server.config;

	var db = mongoose.createConnection(config.db.uri);
	db.mongoose = mongoose;

	return db;
};