"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Models = (function () {
	function Models(server, options) {
		_classCallCheck(this, Models);

		options = options || {};

		this._options = options;
		this._server = server;

		this._models = new Map();
		this._modelModules = new Map();
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
		model: {
			value: function model(name) {
				if (!this._modelModules.has(name)) {
					throw new Error("Modul is not registered: " + name);
				}

				var modelFactory = this._modelModules.get(name);

				if (!this._models.has(name)) {
					this._models.set(name, modelFactory(this.server));
				}

				return this._models.get(name);
			}
		},
		register: {
			value: function register(modelModul) {
				var name = modelModul.name;
				if (!name) {
					throw new Error("Model has no name");
				}

				this._modelModules.set(name, modelModul["default"] ? modelModul["default"] : modelModul);

				Object.defineProperty(this, name, {
					get: function get() {
						return this.model(name);
					}
				});

				return;
			}
		},
		preload: {
			value: function preload() {
				var _this = this;

				this._modelModules.forEach(function (factory, modelName) {
					_this.model(modelName);
				});
			}
		}
	});

	return Models;
})();

module.exports = Models;