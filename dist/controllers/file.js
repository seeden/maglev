'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.upload = upload;
exports.clear = clear;
exports.clearAfterError = clearAfterError;
exports.get = get;
exports.download = download;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _multiparty = require('multiparty');

var _multiparty2 = _interopRequireDefault(_multiparty);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _async = require('async');

var _webError = require('web-error');

var _webError2 = _interopRequireDefault(_webError);

var _download = require('download');

var _download2 = _interopRequireDefault(_download);

var _temporary = require('temporary');

var _temporary2 = _interopRequireDefault(_temporary);

var _okay = require('okay');

var _okay2 = _interopRequireDefault(_okay);

function deleteFiles(files, callback) {
  (0, _async.map)(files, function (file, cb) {
    _fs2['default'].unlink(file.path, function (err) {
      if (err && err.message.indexOf('ENOENT') === -1) {
        return cb(err);
      }

      cb(null, file);
    });
  }, (0, _okay2['default'])(callback, function (removedFiles) {
    callback(null, removedFiles);
  }));
}

function upload(req, res, next) {
  var serverOptions = req.server.options;
  var files = req.objects.files = [];

  var options = {
    maxFieldsSize: serverOptions.upload.maxFieldsSize,
    maxFields: serverOptions.upload.maxFields
  };

  var form = new _multiparty2['default'].Form(options);

  form.on('error', function (err) {
    next(err);
  });

  form.on('field', function (field, value) {
    req.body[field] = value;
  });

  form.on('file', function (name, file) {
    files.push(file);
  });

  form.on('close', function () {
    next();
  });

  form.parse(req);
}

function clear(req, res, next) {
  if (!req.objects.files || !req.objects.files.length) {
    return next();
  }

  deleteFiles(req.objects.files, (0, _okay2['default'])(next, function (removedFiles) {
    req.objects.files = [];
    req.objects.removedFiles = removedFiles;
    next();
  }));
}

function clearAfterError(err, req, res, next) {
  clear(req, res, (0, _okay2['default'])(next, function () {
    next(err);
  }));
}

function get(req, res, next) {
  var file = req.objects.file;
  if (!file) {
    return next(new _webError2['default'](404));
  }

  res.jsonp({
    file: file.toPrivateJSON()
  });
}

function download(req, res, next) {
  var files = req.objects.files = [];

  if (!req.body.url) {
    return next(new _webError2['default'](401));
  }

  var downloadInstance = new _download2['default']().get(req.body.url);
  downloadInstance.run((0, _okay2['default'])(next, function (downloadedFiles) {
    if (!downloadedFiles.length) {
      return next(new _webError2['default'](401));
    }

    var tmpFile = new _temporary2['default'].File();

    var file = {
      fieldName: 'file',
      originalFilename: downloadedFiles[0].path,
      path: tmpFile.path,
      size: downloadedFiles[0].contents.length
    };

    tmpFile.writeFile(downloadedFiles[0].contents, (0, _okay2['default'])(next, function () {
      files.push(file);
      next();
    }));
  }));
}