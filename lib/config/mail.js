'use strict';

var nodemailer = require('nodemailer'),
	directTransport = require('nodemailer-direct-transport');

exports.prepare = function(server) {
	var config = server.config;

	var transport =  nodemailer.createTransport(directTransport(config.mail.options));

	return transport;
};