import fs from 'fs';
import RBAC from 'rbac';
import extend from 'node.extend';
import defaultOptions from './options';
import Router from './router';
import App from './app';
import Secure from './secure';
import Models from './models';
import debug from 'debug';
import heapdump from 'heapdump';
import domain from 'domain';
import { EventEmitter } from 'events';
import util from 'util';
import ok from 'okay';
import { each } from 'async';

const log = debug('maglev:server');
const portOffset = parseInt(process.env.NODE_APP_INSTANCE || 0, 10);

function walk(path, fileCallback, callback) {
  fs.readdir(path, ok(callback, function(files) {
    each(files, function(file, cb) {
      const newPath = path + '/' + file;
      fs.stat(newPath, ok(cb, function(stat) {
        if (stat.isFile()) {
          if (/(.*)\.(js$|coffee$)/.test(file)) {
            const model = require(newPath);
            return fileCallback(model, newPath, file, cb);
          }
        } else if (stat.isDirectory()) {
          return walk(newPath, fileCallback, cb);
        }

        cb();
      }));
    }, callback);
  }));
}

export default class Server extends EventEmitter {
  constructor(options, callback) {
    super();

    if (!callback) {
      throw new Error('Please use callback for server');
    }

    options = extend(true, {}, defaultOptions, options);

    if (!options.db) {
      throw new Error('Db is not defined');
    }

    this._options = options;
    this._db = options.db;

    this.catchErrors(() => {
      this.init(options, callback);
    });
  }

  handleError(e) {
    log(e);

    this.emit('err', e);

    this.closeGracefully();
  }

  catchErrors(callback) {
    const d = domain.create();

    d.id = 'ServerDomain';
    d.on('error', (e) => this.handleError(e));

    try {
      d.run(callback);
    } catch(e) {
      process.nextTick(() => this.handleError(e));
    }
  }

  init(options, callback) {
    this.watchMemoryLeaks(options);

    // catch system termination
    const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
    signals.forEach((signal) => {
      process.on(signal, () => this.closeGracefully());
    });

    // catch PM2 termination
    process.on('message', (msg) => {
      if (msg === 'shutdown') {
        this.closeGracefully();
      }
    });

    this._rbac = new RBAC(options.rbac.options, ok(callback, () => {
      this._router = new Router(options.router); // router is used in app
      this._models = new Models(this, options.models); // models is used in secure
      this._secure = new Secure(this);

      this._app = new App(this, options);

      this._loadRoutes(ok(callback, () => {
        this._loadModels(ok(callback, () => {
          callback(null, this);
        }));
      }));
    }));
  }

  notifyPM2Online() {
    if (!process.send) {
      return;
    }

    // after callback
    process.nextTick(function notify() {
      process.send('online');
    });
  }

  watchMemoryLeaks(options) {
    if (!options.memoryLeaks.watch) {
      return;
    }

    const memwatch = require('memwatch-next');
    memwatch.on('leak', (info) => {
      log('Memory leak detected: ', info);

      if (options.memoryLeaks.showHeap) {
        this.showHeapDiff();
      }

      if (options.memoryLeaks.path) {
        if (typeof global.gc === 'function') {
          global.gc();
        }

        const file = options.memoryLeaks.path + '/' + process.pid + '-' + Date.now() + '.heapsnapshot';
        heapdump.writeSnapshot(file, function writeSnapshotCallback(err) {
          if (err) {
            log(err);
          } else {
            log('Wrote snapshot: ' + file);
          }
        });
      }
    });
  }

  showHeapDiff() {
    if (!this.hd) {
      this.hd = new memwatch.HeapDiff();
    } else {
      const diff = this.hd.end();
      log(util.inspect(diff, true, null));
      this.hd = null;
    }
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
    if (!callback) {
      throw new Error('Callback is undefined');
    }

    if (this._listening) {
      callback(new Error('Server is already listening'));
      return this;
    }

    this._listening = true;

    const options = this.options;
    this.app.listen(options.server.port + portOffset, options.server.host, ok(callback, () => {
      log(`Server is listening on port: ${this.app.httpServer.address().port}`);

      this.notifyPM2Online();

      callback(null, this);
    }));

    return this;
  }

  close(callback) {
    if (!callback) {
      throw new Error('Callback is undefined');
    }

    if (!this._listening) {
      callback(new Error('Server is not listening'));
      return this;
    }

    this._listening = false;

    this.app.close(callback);

    return this;
  }

  closeGracefully() {
    log('Received kill signal (SIGTERM), shutting down gracefully.');
    if (!this._listening) {
      log('Ended without any problem');
      process.exit(0);
      return;
    }

    let termTimeoutID = null;

    this.close(function closeCallback(err) {
      if (termTimeoutID) {
        clearTimeout(termTimeoutID);
        termTimeoutID = null;
      }

      if (err) {
        log(err.message);
        process.exit(1);
        return;
      }

      log('Ended without any problem');
      process.exit(0);
    });

    const options = this.options;
    termTimeoutID = setTimeout(function timeoutCallback() {
      termTimeoutID = null;
      log('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, options.shutdown.timeout);
  }

  _loadModels(callback) {
    const models = this._models;
    const path = this.options.root + '/models';

    walk(path, function processModel(model, modelPath, file, cb) {
      try {
        log(`Loading model: ${modelPath}`);
        models.register(model);
        cb();
      } catch(e) {
        log(`Problem with model: ${modelPath}`);
        cb(e);
      }
    }, ok(callback, function() {
      // preload all models
      models.preload(callback);
    }));
  }

  _loadRoutes(callback) {
    const router = this.router;
    const path = this.options.root + '/routes';

    walk(path, function processPath(route, routePath, file, cb) {
      try {
        log(`Loading route: ${routePath}`);
        route(router);
        cb();
      } catch(e) {
        log(`Problem with route: ${routePath}`);
        cb(e);
      }
    }, callback);
  }
}

