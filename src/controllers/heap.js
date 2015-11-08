import heapdump from 'heapdump';
import ok from 'okay';
import debug from 'debug';

const log = debug('maglev:heapController');

export function save(req, res, next) {
  const options = req.server.options;
  const path = options.memoryLeaks.path;
  if (!path) {
    return next(new Error('MemoryLeak path is not defined'));
  }

  const file = path + '/' + process.pid + '-' + Date.now() + '.heapsnapshot';

  if (typeof global.gc === 'function') {
    log('cleaning GC');
    global.gc();
  }

  heapdump.writeSnapshot(file, ok(next, () => {
    res.status(204).jsonp({});
  }));
}
