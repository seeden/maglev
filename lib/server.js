'use strict';

var fs = require('fs');

function Server(config) {
	this._config = config;

	this._rbac = config.rbac.prepare(this);

	this._db = null;
	this._secure = null;
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
	'secure': {
		get: function() {
			return this._secure;
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
	var config = this.config;

	//prepare
	config.init(this);

	//prepare database
	this._db = config.db.prepare(this);

	//load models
	this._loadModels();

	//config secure
	this._secure = config.secure.prepare(this);

	//config mail
	this._mail = config.mail.prepare(this);

	//config app listener
	this._app = config.server.prepare(this);

	//prepare route
	this._route = config.route.prepare(this);

	//init routes
	this._loadRoutes();

	//listen on port and host
	this.app.listen(this.config.server.port, this.config.server.host);
	console.log('Server started on port ' + this.config.server.port + ' and host ' + this.config.server.host);
};

Server.prototype._loadModels = function() {
	var self = this;
	var path = this.config.server.root + '/models';
	Server.walk(path, function(model, modelPath) {
		try {
			self._models[model.name] = model.createModel(self.db);	
		} catch(e) {
			console.error('There is problem with model: '+ modelPath);
			throw e;
		}
	});
};

Server.prototype._loadRoutes = function() {
	var self = this;
	var path = this.config.server.root + '/routes';
	Server.walk(path, function(route, routePath) {
		console.info('Loading route: ' + routePath);

		try {
			route(self.route);
		} catch(e) {
			console.error('There is problem with route: ' + routePath);
			throw e;
		}
	});
};

Server.walk = function(path, callback) {
	fs.readdirSync(path).forEach(function(file) {
		var newPath = path + '/' + file;
		var stat = fs.statSync(newPath);
		if (stat.isFile()) {
			if (/(.*)\.(js$|coffee$)/.test(file)) {
				callback(require(newPath), newPath);
			}
		} else if (stat.isDirectory()) {
			Server.walk(newPath, callback);
		}
	});
};

module.exports = Server;