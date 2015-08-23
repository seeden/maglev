'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.save = save;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _heapdump = require('heapdump');

var _heapdump2 = _interopRequireDefault(_heapdump);

var _okay = require('okay');

var _okay2 = _interopRequireDefault(_okay);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var log = (0, _debug2['default'])('maglev:heapController');

function save(req, res, next) {
  var options = req.server.options;
  var path = options.memoryLeaks.path;
  if (!path) {
    return next(new Error('MemoryLeak path is not defined'));
  }

  var file = path + '/' + process.pid + '-' + Date.now() + '.heapsnapshot';

  if (typeof global.gc === 'function') {
    log('cleaning GC');
    global.gc();
  }

  _heapdump2['default'].writeSnapshot(file, (0, _okay2['default'])(next, function () {
    res.status(204).jsonp({});
  }));
}