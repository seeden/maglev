import multiparty from 'multiparty';
import fs from 'fs';
import { map } from 'async';
import WebError from 'web-error';
import Download from 'download';
import tmp from 'temporary';

export function upload(req, res, next) {
	var config = req.server.config;
	var files = req.objects.files = [];

	var options = options || {};
	options.maxFieldsSize = options.maxFieldsSize || config.upload.maxFieldsSize;
	options.maxFields = options.maxFields || config.upload.maxFields;
	
	var form = new multiparty.Form(options);

	form.on('error', function (err) {
		next(err);
	});

	form.on('field', function (field, value) {
		req.body[field] = value;
	});

	form.on('file', function (name, file) {
		files.push(file);
	});

	form.on('close', function() {
		next();
	});

	form.parse(req);
}

export function clear(req, res, next) {
	if(!req.objects.files || !req.objects.files.length) {
		return next();
	}

	deleteFiles(req.objects.files, function(err, removedFiles) {
		if(err) {
			return next(err);
		}

		req.objects.files = [];
		req.objects.removedFiles = removedFiles;
		next();
	});
}

export function clearAfterError(err, req, res, next) {
	clear(req, res, function(err2) {
		next(err2 || err);
	});
}

function deleteFiles(files, callback) {
	map(files, function (file, cb) {
		fs.unlink(file.path, function (err) {
			if(err && err.message.indexOf('ENOENT')===-1) {
				return cb(err);
			};

			cb(null, file);
		});
	}, function (err, removedFiles) {
		if(err) {
			return callback(err);
		}

		callback(null, removedFiles);
	});	
}

export function get(req, res, next) {
	var file = req.objects.file;

	if(!file) {
		return next(new WebError(404));
	}

	res.jsonp({
		file: file.toPrivateJSON()
	});
}

export function download(req, res, next) {
	var config = req.server.config;
	var files = req.objects.files = [];

	if(!req.body.url) {
		return next(new WebError(401));	
	}

	var options = options || {};
	options.maxFieldsSize = options.maxFieldsSize || config.upload.maxFieldsSize;

	var download = new Download().get(req.body.url);

    download.run(function (err, downloadedFiles) {
    	if(err) {
    		return next(err);
    	}

    	if(!downloadedFiles.length) {
    		return next(new WebError(401));		
    	}

    	var tmpFile = new tmp.File();

    	var file = {
    		fieldName: 'file',
    		originalFilename: downloadedFiles[0].path,
    		path: tmpFile.path,
    		size: downloadedFiles[0].contents.length
    	};

    	tmpFile.writeFile(downloadedFiles[0].contents, function(err) {
    		if(err) {
    			return next(err);
    		}

    		files.push(file);
    		next();
    	});
	});
}



/*

var useExt= function(orgPath, ext){
	if(!ext) {
		return orgPath; 
	}

	orgPath = orgPath.replace(/\.[^/.]+$/, "");

	return orgPath+'.'+ext;
};

exports.storeFirstImage = function(options) {
	options = options || {};

	options.exts = options.exts || ['jpg', 'jpeg', 'png']; //available exts
	options.ext = options.ext || null;   //finall ext

	options.maxWidth = options.maxWidth || null;
	options.maxHeight = options.maxHeight || null;
	options.minWidth = options.minWidth || null;
	options.minHeight = options.minHeight || null;
	options.compress = options.compress || null; //None, BZip, Fax, Group4, JPEG, Lossless, LZW, RLE, Zip, or LZMA
	options.quality = options.quality || null;  //0 - 100
	options.interlace = options.interlace || false;  //null|Line|Plane|Partition
	options.noProfile = typeof options.noProfile !== 'undefined' ? options.noProfile : true;

	var storeFirstMiddleware = storeFirst(options);

	if(options.compress === 'JPEG') {
		options.ext = 'jpg';
	}

	return function(req, res, next) {
		var files = req.objects.files;


		if(!files || !files.length) {
			return next(new WebError(401, 'Files is undefined'));
		}

		var file = files[0],
			orgPath = file.path,
			image = gm(orgPath);

		if(!image) {
			return next(new WebError(401, 'Image is not a image'));
		}

		image.size(function (err, size) {
			if(err) {
				return next(err);
			}

			var changed = false;

			if(options.minWidth && options.minWidth>size.width) {
				return next(new WebError(401, 'Image has smaller width'));
			}

			if(options.minHeight && options.minHeight>size.height) {
				return next(new WebError(401, 'Image has smaller height'));
			}	

			if(options.maxWidth || options.maxHeight) {
				image.resize(options.maxWidth, options.maxHeight);
				changed=true;
			}

			if(options.interlace) {
				image.interlace();
				changed=true;
			}

			if(options.quality) {
				image.quality(options.quality);
				changed=true;
			}

			if(options.compress) {
				image.compress(options.compress);
				changed=true;
			}

			if(options.noProfile) {
				image.noProfile();
				changed=true;
			}

			if(!changed) {
				return storeFirstMiddleware(req, res, next);
			}

			var newPath = useExt(file.path, options.ext);
			
			image.write(newPath, function (err) {
  				if (err) {
  					return next(err);
  				};

  				var stats = fs.statSync(newPath);
  				file.size = stats['size'];
  				file.path = newPath;
				file.originalFilename = useExt(file.originalFilename, options.ext);

  				return storeFirstMiddleware(req, res, next);
			});
		});
	}
};*/