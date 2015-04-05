export default class Models {
	constructor(server, options) {
		options = options || {};

		this._options = options;
		this._server = server;

		this._models = new Map();
		this._modelModules = new Map();
	}

	get options() {
		return this._options;
	}	

	get server() {
		return this._server;
	}

	model(name) {
		if(!this._modelModules.has(name)) {
			throw new Error('Modul is not registered: ' + name);
		}

		var modelFactory = this._modelModules.get(name);

		if(!this._models.has(name)) {
			this._models.add(name, modelFactory(this.server));
		}

		return this._models.get(name);
	}

	register(modelModul) {
		var name = modelModul.name;
		if(!name) {
			throw new Error('Model has no name');
		}

		this._modelModules.add(name,  modelModul.default
			? modelModul.default
			: modelModul);

		Object.defineProperty(this, name, {
			get: function() {
				return this.model(name);
			}
		});

		return;
	}

	preload() {
		this._modelModules.forEach((factory, modelName) => {
			console.log(modelName);
			this.model(modelName);
		});
	}
}