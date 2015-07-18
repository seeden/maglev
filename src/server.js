import fs from 'fs';
import RBAC from 'rbac';
import extend from 'node.extend';
import defaultOptions from './options';
import Router from './router';
import App from './app';
import Secure from './secure';
import Models from './models';
import debug from 'debug';

const log = debug('maglev:server');

export default class Server {
  constructor(options, callback) {
    if (!callback) {
      throw new Error('Please use callback for server');
    }

    options = extend(true, {}, defaultOptions, options);

    if (!options.db) {
      throw new Error('Db is not defined');
    }

    this._options = options;
    this._db = options.db;

    this._rbac = new RBAC(options.rbac.options, err => {
      if (err) {
        return callback(err);
      }

      this._router = new Router(options.router); // router is used in app
      this._models = new Models(this, options.models); // models is used in secure
      this._secure = new Secure(this);

      this._app = new App(this, options);

      this._loadRoutes();

      this._loadModels((err2) => {
        if (err2) {
          return callback(err2);
        }

        callback(null, this);
      });
    });
  }

  get options() {
    return this._options;
  }

  get rbac() {
    return this._rbac;
  }

  get db() {
    return this._db;
  }

  get secure() {
    return this._secure;
  }

  get app() {
    return this._app;
  }

  get router() {
    return this._router;
  }

  get models() {
    return this._models;
  }

  listen(callback) {
    const options = this.options;
    this.app.listen(options.server.port, options.server.host, callback);
    return this;
  }

  close(callback) {
    this.app.close(callback);
    return this;
  }

  _loadModels(callback) {
    const models = this._models;
    const path = this.options.root + '/models';

    Server.walk(path, function(model, modelPath) {
      try {
        models.register(model);
      } catch(e) {
        log('problem with model: ' + modelPath);
        throw e;
      }
    });

    // preload all models
    models.preload(callback);
  }

  _loadRoutes() {
    const router = this.router;
    const path = this.options.root + '/routes';

    Server.walk(path, function(route, routePath) {
      try {
        route(router);
      } catch(e) {
        log('problem with route: ' + routePath);
        throw e;
      }
    });
  }

  static walk(path, callback) {
    if (!fs.existsSync(path)) {
      log('Path does not exists: ' + path);
      return;
    }

    fs.readdirSync(path).forEach(function(file) {
      const newPath = path + '/' + file;
      const stat = fs.statSync(newPath);

      if (stat.isFile()) {
        if (/(.*)\.(js$|coffee$)/.test(file)) {
          const model = require(newPath);
          callback(model, newPath, file);
        }
      } else if (stat.isDirectory()) {
        Server.walk(newPath, callback);
      }
    });
  }
}
