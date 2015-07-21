import heapdump from 'heapdump';
import ok from 'okay';

export function save(req, res, next) {
  const options = req.server.options;
  const path = options.memoryLeaks.path;
  if (!path) {
    return next(new Error('MemoryLeak path is not defined'));
  }

  const file = path + '/' + process.pid + '-' + Date.now() + '.heapsnapshot';
  heapdump.writeSnapshot(file, ok(next, function() {
    res.status(204).jsonp({});
  }));
}
