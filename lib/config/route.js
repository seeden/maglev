'use strict';

var Route = require('./../route');

exports.prepare = function(server) {
	return new Route(server, Route.basic);
};