'use strict';

var methods = require('methods'),
	_ = require('underscore');

function Route (server, route, parent) {
	this._server = server;
	this._route = route;
	this._config = server.config;
	this._parent = parent || null;

	this.reset();
}

Route.prototype.reset = function() {
	this._data = {
		prefix: null,
		lg: null,
		state: null
	};

	if(this._parent !== null) {
		this._data = this._parent.getData();	
	}
};

Route.prototype._setData = function(key, value) {
	this._data[key]	= value;
	return this;
};

Route.prototype.getData = function() {
	return _.extend({}, this._data);
};

Route.prototype.clone = function() {
	return new Route(this._server, this._route, this);
};

Route.prototype.end = function() {
	return this._parent;
};

Route.prototype.prefix = function(prefix) {
	if(!prefix) {
		throw new Error('Prefix is undefined');
	}

	var prefix = (this._data.prefix !== null) ?
		this._data.prefix + prefix :
		prefix;

	return this.clone()._setData('prefix', prefix);
};

Route.prototype.api = function(prefix) {
	var prefix = prefix || this._config.api.path;

	return this.prefix(prefix);
};

Route.prototype.lg = function(value) {
	return this.clone()._setData('lg', value);
};

Route.prototype._processPath = function(method, path, callbacks) {
	var args = [].slice.call(arguments, 2);
	var paths = this._preparePath(path);

	for(var i=0; i<paths.length; i++) {
		var params = [paths[i]].concat(args);
		this._route[method].apply(this._route, params);	
	}

	return paths;
};

Route.prototype._preparePath = function(path) {
 	var paths = [];

 	if(this._data.prefix) {
 		path = this._data.prefix + path;
 	}

 	if(this._config.locale.inUrl === true && this._data.lg !== false) {
 		var lgs = (this._data.lg === null) ?
 			this._config.locale.available :
 			this._data.lg;

	 	for(var i=0; i<lgs.length; i++) {
	 		paths.push('/'+lgs[i]+path);	
	 	}	
 	}

 	paths.push(path);

	return paths;
};

Route.prototype.param = function(name, callback) {
	return this._route.param.apply(this._route, arguments);
};

methods.forEach(function(method) {
	Route.prototype[method] = function(path, callbacks) {
		var args = [].slice.call(arguments, 0);
		this._processPath.apply(this, [method].concat(args));
		return this;
	};
});

module.exports = Route;