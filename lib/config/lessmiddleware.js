'use strict';

var lessMiddleware = require('less-middleware'),
	path = require('path');

exports.prepare = function(server) {
	var config = server.config;
	var pathToPublic = path.join(config.server.root, '/public');

	var options = {
		debug: config.css.debug
	};

	var parserOptions = {};

	var compilerOptions = {
		compress: config.css.compress,
		sourceMap: config.css.sourceMap
	};

	return lessMiddleware(pathToPublic, options, parserOptions, compilerOptions);
};