'use strict';

var nodemailer = require('nodemailer');

exports.prepare = function(config, server) {
	var transport = nodemailer.createTransport(config.mail.type, config.mail.options);

	return transport;
};