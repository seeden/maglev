'use strict';

var nodemailer = require('nodemailer');

exports.prepare = function(server) {
	var config = server.config;
	
	var transport = nodemailer.createTransport(config.mail.type, config.mail.options);

	return transport;
};