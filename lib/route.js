'use strict';

var methods = require('methods'),
	_ = require('underscore'),
	express = require('express');

function Route (server, route, parent) {
	this._server = server;
	this._route = route;
	this._config = server.config;
	this._parent = parent || null;
}

Route.prototype.end = function() {
	return this._parent;
};

Route.prototype.use = function(prefix) {
	var newRoute = express.Router();
	this._route.use(prefix, newRoute);
	return new Route(this._server, newRoute, this);
};

Route.prototype.api = function(prefix) {
	var prefix = prefix || this._config.api.path;
	return this.use(prefix);
};

Route.prototype.param = function(name, callback) {
	this._route.param.apply(this._route, arguments);
	return this;
};

methods.forEach(function(method) {
	Route.prototype[method] = function(path, callbacks) {
		this._route[method].apply(this._route, arguments);	
		return this;
	};
});

Route.basic = express.Router();

module.exports = Route;