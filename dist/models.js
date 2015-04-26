"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _async = require("async");

var each = _async.each;
var memoize = _async.memoize;

var Models = (function () {
	function Models(server, options) {
		_classCallCheck(this, Models);

		options = options || {};

		this._options = options;
		this._server = server;

		this._models = new Map();
		this._modelFactories = new Map();
	}

	_createClass(Models, {
		options: {
			get: function () {
				return this._options;
			}
		},
		server: {
			get: function () {
				return this._server;
			}
		},
		_createModelFromFactory: {
			value: function _createModelFromFactory(name) {
				if (!this._modelFactories.has(name)) {
					throw new Error("Modul is not registered: " + name);
				}

				var modelFactory = this._modelFactories.get(name);
				var config = {
					model: null,
					callbacks: []
				};

				config.model = modelFactory(this.server, function (error) {
					config.loaded = true;
					config.error = error;

					config.callbacks.forEach(function (callback) {
						callback(error, model);
					});

					config.callbacks = [];
				});

				this._models.set(name, config);
			}
		},
		model: {
			value: function model(name, callback) {
				if (!this._models.has(name)) {
					this._createModelFromFactory(name);
				}

				var config = this._models.get(name);

				if (!callback) {
					return config.model;
				}

				//TODO replace it with async.memorize
				if (config.loaded) {
					callback(config.error, config.model);
				} else {
					config.calbacks.push(callback);
				}

				return config.model;
			}
		},
		register: {
			value: function register(modelModul) {
				var name = modelModul.name;
				if (!name) {
					throw new Error("Model has no name");
				}

				this._modelFactories.set(name, modelModul["default"] ? modelModul["default"] : modelModul);

				Object.defineProperty(this, name, {
					get: function get() {
						return this.model(name);
					}
				});
			}
		},
		preload: {
			value: function preload(callback) {
				var _this = this;

				each(this._modelFactories.keys(), function (modelName, callback) {
					_this.model(modelName, callback);
				}, callback);
			}
		}
	});

	return Models;
})();

module.exports = Models;