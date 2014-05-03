'use strict';

var lessMiddleware = require('less-middleware');

exports.prepare = function(server) {
	var config = server.config;

	return lessMiddleware({
		src: config.server.root + '/public',
		compress: config.css.compress,
		debug: config.css.debug
	});
};