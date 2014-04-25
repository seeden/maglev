'use strict';

var fs = require('fs'),
	Route = require('./route'),
	RBAC = require('rbac'),
	_ = require('underscore');

function Server(config, rbac) {
	this._config = config;

	this._rbac = rbac || new RBAC();
	this._db = null;
	this._passport = null;
	this._app = null;
	this._route = null;
	this._mail = null;

	this._models = {};
}

Object.defineProperties(Server.prototype, {
	'config': {
		get: function() {
			return this._config;
		}
	},
	'rbac': {
		get: function() {
			return this._rbac;
		}
	},
	'db': {
		get: function() {
			return this._db;
		}
	},
	'passport': {
		get: function() {
			return this._passport;
		}
	},
	'mail': {
		get: function() {
			return this._mail;
		}
	},
	'app': {
		get: function() {
			return this._app;
		}
	},
	'route': {
		get: function() {
			return this._route;
		}
	},
	'models': {
		get: function() {
			return this._models;
		}
	}
});


Server.prototype.start = function() {
	//check configuration
	this.config.validate();

	//prepare database
	this._db = this.config.prepareDb(this);

	//load models
	this._loadModels();

	//config passport
	this._passport = this.config.preparePassport(this);

	//config mail
	this._mail = this.config.prepareMail(this);

	//config app listener
	this._app = this.config.prepareApp(this);

	//prepare route
	this._route = new Route(this, Route.basic)

	//init routes
	this._loadRoutes();

	//listen on port and host
	this.app.listen(this.config.server.port, this.config.server.host);
	console.log('Server started on port ' + this.config.server.port + ' and host ' + this.config.server.host);
};

Server.prototype._loadModels = function() {
	var self = this;
	var path = this.config.server.root + '/models';
	Server.walk(path, function(model) {
		self._models[model.name] = model.createModel(self.db);
	});
};

Server.prototype._loadRoutes = function() {
	var self = this;
	var path = this.config.server.root + '/routes';
	Server.walk(path, function(route) {
		route(self.route);
	});
};

Server.walk = function(path, callback) {
	fs.readdirSync(path).forEach(function(file) {
		var newPath = path + '/' + file;
		var stat = fs.statSync(newPath);
		if (stat.isFile()) {
			if (/(.*)\.(js$|coffee$)/.test(file)) {
				callback(require(newPath));
			}
		} else if (stat.isDirectory()) {
			Server.walk(newPath, callback);
		}
	});
};

module.exports = Server;