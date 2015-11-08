import multiparty from 'multiparty';
import fs from 'fs';
import { map } from 'async';
import WebError from 'web-error';
import Download from 'download';
import tmp from 'temporary';
import ok from 'okay';

function deleteFiles(files, callback) {
  map(files, (file, cb) => {
    fs.unlink(file.path, (err) => {
      if (err && err.message.indexOf('ENOENT') === -1) {
        return cb(err);
      }

      cb(null, file);
    });
  }, ok(callback, (removedFiles) => {
    callback(null, removedFiles);
  }));
}

export function upload(req, res, next) {
  const serverOptions = req.server.options;
  const files = req.objects.files = [];

  const options = {
    maxFieldsSize: serverOptions.upload.maxFieldsSize,
    maxFields: serverOptions.upload.maxFields,
  };

  const form = new multiparty.Form(options);

  form.on('error', (err) => {
    next(err);
  });

  form.on('field', (field, value) => {
    req.body[field] = value;
  });

  form.on('file', (name, file) => {
    files.push(file);
  });

  form.on('close', () => {
    next();
  });

  form.parse(req);
}

export function clear(req, res, next) {
  if (!req.objects.files || !req.objects.files.length) {
    return next();
  }

  deleteFiles(req.objects.files, ok(next, (removedFiles) => {
    req.objects.files = [];
    req.objects.removedFiles = removedFiles;
    next();
  }));
}

export function clearAfterError(err, req, res, next) {
  clear(req, res, ok(next, () => {
    next(err);
  }));
}

export function get(req, res, next) {
  const file = req.objects.file;
  if (!file) {
    return next(new WebError(404));
  }

  res.jsonp({
    file: file.toPrivateJSON(),
  });
}

export function download(req, res, next) {
  const files = req.objects.files = [];

  if (!req.body.url) {
    return next(new WebError(401));
  }

  const downloadInstance = new Download().get(req.body.url);
  downloadInstance.run(ok(next, (downloadedFiles) => {
    if (!downloadedFiles.length) {
      return next(new WebError(401));
    }

    const tmpFile = new tmp.File();

    const file = {
      fieldName: 'file',
      originalFilename: downloadedFiles[0].path,
      path: tmpFile.path,
      size: downloadedFiles[0].contents.length,
    };

    tmpFile.writeFile(downloadedFiles[0].contents, ok(next, () => {
      files.push(file);
      next();
    }));
  }));
}
