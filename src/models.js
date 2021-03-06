import { each } from 'async';

export default class Models {
  constructor(server, options = {}) {
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
    if (!this._modelFactories.has(name)) {
      throw new Error(`Modul is not registered: ${name}`);
    }

    const modelFactory = this._modelFactories.get(name);
    const config = {
      model: null,
      callbacks: [],
    };

    if (typeof modelFactory !== 'function') {
      throw new Error(`Model factory is not a function for model: ${name}`);
    }

    config.model = modelFactory(this.server, function modelFactoryCallback(error) {
      config.loaded = true;
      config.error = error;

      config.callbacks.forEach(function eachCallback(callback) {
        callback(error, config.model);
      });

      config.callbacks = [];
    });

    this._models.set(name, config);
  }

  model(name, callback) {
    if (!this._models.has(name)) {
      this._createModelFromFactory(name);
    }

    const config = this._models.get(name);

    if (!callback) {
      return config.model;
    }

    // TODO replace it with async.memorize
    if (config.loaded) {
      callback(config.error, config.model);
    } else {
      config.callbacks.push(callback);
    }

    return config.model;
  }

  register(modelModul) {
    const name = modelModul.name;
    if (!name) {
      throw new Error('Model has no name');
    }

    this._modelFactories.set(name, modelModul.default
      ? modelModul.default
      : modelModul);

    Object.defineProperty(this, name, {
      get: function getProperty() {
        return this.model(name);
      },
    });
  }

  preload(callback) {
    const keys = [];
    this._modelFactories.forEach(function eachModelFactory(factory, modelName) {
      keys.push(modelName);
    });

    each(keys, (modelName, cb) => this.model(modelName, cb), callback);
  }
}
