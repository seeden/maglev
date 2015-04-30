import { each, memoize } from 'async';

export default class Models {
	constructor(server, options) {
		options = options || {};

		this._options = options;
		this._server = server;

		this._models = new Map();
		this._modelFactories = new Map();
	}

	get options() {
		return this._options;
	}	

	get server() {
		return this._server;
	}

	_createModelFromFactory(name) {
		if(!this._modelFactories.has(name)) {
			throw new Error('Modul is not registered: ' + name);
		}

		const modelFactory = this._modelFactories.get(name);
		const config = {
			model: null,		
			callbacks: []
		};

		config.model = modelFactory(this.server, function(error) {
			config.loaded = true;
			config.error = error;

			config.callbacks.forEach(function(callback) {
				callback(error, config.model);
			});

			config.callbacks = [];
		});

		this._models.set(name, config);
	}

	model(name, callback) {
		if(!this._models.has(name)) {
			this._createModelFromFactory(name);
		}

		const config = this._models.get(name);

		if(!callback) {
			return config.model;
		}

		//TODO replace it with async.memorize
		if(config.loaded) {
			callback(config.error, config.model);
		} else {
			config.callbacks.push(callback);
		}

		return config.model;
	}

	register(modelModul) {
		var name = modelModul.name;
		if(!name) {
			throw new Error('Model has no name');
		}

		this._modelFactories.set(name,  modelModul.default
			? modelModul.default
			: modelModul);

		Object.defineProperty(this, name, {
			get: function() {
				return this.model(name);
			}
		});
	}

	preload(callback) {
		var keys = [];
		this._modelFactories.forEach(function(factory, modelName) {
			keys.push(modelName);
		});

		each(keys, (modelName, callback) => {
			this.model(modelName, callback);
		}, callback);
	}
}