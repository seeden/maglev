'use strict';

var fs = require('fs'),
	cluster = require('cluster');

var Server = module.exports = function Server(config) {
	this._config = config;

	this._rbac = config.rbac.prepare(this);

	this._db = null;
	this._secure = null;
	this._app = null;
	this._route = null;

	this._robots = [];
	this._models = {};
};

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

	//master is used as express instance
	if(cluster.isMaster) {
		//config app listener
		this._app = config.server.prepare(this);

		//prepare route
		this._route = config.route.prepare(this);

		//init routes
		this._loadRoutes();

		//listen on port and host
		this.app.listen(this.config.server.port, this.config.server.host);
		console.log('Server started on port ' + this.config.server.port + ' and host ' + this.config.server.host);
	} else if(process.env.isRobot) {
		console.log('Loading robot: ' + process.env.robotPath);
		var robot = require(process.env.robotPath);

		console.log('Starting robot: ' + process.env.robotPath);
		robot.start(this);
	}

	if(cluster.isMaster) {
		//prepare robots
		this._loadRobots();
	} 
};

Server.prototype._loadModels = function() {
	var _this = this,
		path = this.config.server.root + '/models';

	Server.walk(path, function(model, modelPath) {
		try {
			var Model = model.createModel(_this.db);
			_this._models[Model.modelName] = Model;	
		} catch(e) {
			console.error('There is problem with model: '+ modelPath);
			throw e;
		}
	});
};

Server.prototype._loadRobots = function() {
	var _this = this,
		path = this.config.server.root + '/robots';

	//automatically respwan robot if end
    cluster.on("exit", function(worker, code, signal) {
    	for(var i=0; i<_this._robots.length; i++) {
    		var robot = _this._robots[i];

    		if(robot.worker !== worker) {
    			continue;
    		}

    		if(!robot.respawn) {
    			break;
    		}

    		robot.worker = cluster.fork({
				isRobot: true,
				robotPath: robot.path
			});
    	}
    });		

	Server.walk(path, function(robot, robotPath) {
		try {
			_this._robots.push({
				path: robotPath,
				respawn: robot.respawn || false,
				worker: cluster.fork({
					isRobot: true,
					robotPath: robotPath
				})
			});
		} catch(e) {
			console.error('There is problem with robot: '+ robotPath);
			throw e;
		}
	});
};

Server.prototype._loadRoutes = function() {
	var _this = this,
		path = this.config.server.root + '/routes';

	Server.walk(path, function(route, routePath) {
		console.info('Loading route: ' + routePath);

		try {
			route(_this.route);
		} catch(e) {
			console.error('There is problem with route: ' + routePath);
			throw e;
		}
	});
};

Server.walk = function(path, callback) {
	if (!fs.existsSync(path)) {
    	console.log('Path does not exists: ' + path);
    	return;
    }

	fs.readdirSync(path).forEach(function(file) {
		var newPath = path + '/' + file,
			stat = fs.statSync(newPath);

		if (stat.isFile()) {
			if (/(.*)\.(js$|coffee$)/.test(file)) {
				callback(require(newPath), newPath);
			}
		} else if (stat.isDirectory()) {
			Server.walk(newPath, callback);
		}
	});
};