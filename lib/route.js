'use strict';

var methods = require('methods');
var _ = require('underscore');
var express = require('express');

function Route (server, route, parent) {
	this._server = server;
	this._route = route;
	this._config = server.config;
	this._parent = parent || null;
}

Route.prototype.end = function() {
	return this._parent;
};

Route.prototype.route = function(prefix) {
	var newRoute = express.Router();
	this._route.use(prefix, newRoute);
	return new Route(this._server, newRoute, this);
};

Route.prototype.api = function(prefix) {
	var prefix = prefix || this._config.route.api.path;
	return this.route(prefix);
};

Route.prototype.param = function(name, callback) {
	this._route.param.apply(this._route, arguments);
	return this;
};
/*
Route.prototype.use = function(name, ) {
	this._route.route.apply(this._route, arguments);
	return this;
};*/

methods.forEach(function(method) {
	Route.prototype[method] = function(path, callbacks) {
		this._route[method].apply(this._route, arguments);	
		return this;
	};
});

Route.basic = express.Router();

module.exports = Route;