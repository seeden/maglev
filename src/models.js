export default class Models {
	constructor(server, options) {
		options = options || {};

		this._options = options;
		this._server = server;

		this._models = {};
		this._modelModules = {};
	}

	get isLazy() {
		return !!options.isLazy;
	}

	get server() {
		return options._server;
	}

	model(name) {
		if(!this._modelModules[name]) {
			throw new Error('Modul is not registered: ' + name);
		}

		if(!this._models[name]) {
			this._models[name] = this._modelModules[name](this.server);
		}

		return this._models[name];
	}

	register(modelModul) {
		var name = modelModul.name;
		if(!name) {
			throw new Error('Model has no name');
		}

		this._modelModules[name] = modelModul.default
			? modelModul.default
			: modelModul;

		Object.defineProperty(this, name, {
			get: function() {
				return this.model(name);
			}
		});

		if(this.isLazy) {
			return;
		}

		return this.model(name);
	}
}