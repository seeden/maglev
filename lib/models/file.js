'use strict';

var Puid = require('puid'),
	uuid = require('node-uuid'),
	path = require('path'),
	fs = require('fs'),
	gm = require('gm'),
	mv = require('mv');

var puid = new Puid();
var puidShort = new Puid(true);

var DIRECTORY_SEPARATOR = '/';

function fileNameToDirs(fileName, dirLength, dirCount) {
	var minSize = dirLength*dirCount;
	if(fileName.length<minSize) {
		return null;
	}

	var chunks = fileName.match(new RegExp('.{1,' + dirLength + '}', 'g'));
	var dirs = chunks.slice(0, dirCount);	

	return dirs.join(DIRECTORY_SEPARATOR);
}

function getPath(fileName, basePath, dirLength, dirCount) {
	if(!basePath || !fileName) {
		throw new Error('Parameter is undefined');
	}

	if(dirLength && dirCount) {
		basePath += DIRECTORY_SEPARATOR + fileNameToDirs(fileName, dirLength, dirCount);
	}

	basePath += DIRECTORY_SEPARATOR + fileName;

	return basePath;
}

function genUniqueName(securedName, cb) {
	var unique = securedName 
		? puid.generate() + '-' + uuid.v4()
		: puidShort.generate();

	unique = unique.split('').reverse().join('');
	cb(null, unique);
}

function getExtension(filename) {
	if(!filename) {
		return null;
	}

    var ext = path.extname(filename).split('.').pop().toLowerCase();
    return ext.length ? ext : null;
}

function storeUploadedFile(file, options, cb) {
	var _this = this,
		originalFilename = file['originalFilename'];

	options = options || {};

	if(!file || !file.path) {
		return cb(new Error('File is undefined'));
	}

	if(!options.path) {
		return cb(new Error('Path is undefined'));
	}

	var ext = getExtension(originalFilename);
	if(options.exts && options.exts.length && options.exts.indexOf(ext) === -1) {
		return cb(new Error('Ext is not allowed')); 
	}

	genUniqueName(options.securedName, function(err, name) {
		if(err) {
			return cb(err);
		}

		var data = {
			fileName: ext ? name +'.' + ext : name,
			name : name,
			version: options.version || null,
			ext : ext,
			size: file.size,
			isTemporary: options.isTemporary || false
		};

		data.path = getPath(data.fileName, options.path, options.dirLength, options.dirCount);

		mv(file.path, data.path, { mkdirp: true }, function (err) {
			if(err) {
				return cb(err);
			}

			_this.create(data, cb);
		});
	});
}

function useExt(orgPath, ext){
	if(!ext) {
		return orgPath; 
	}

	orgPath = orgPath.replace(/\.[^/.]+$/, "");
	return orgPath+'.'+ext;
}

function storeUploadedImage(file, options, cb) {
	var _this = this;
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

	if(options.compress === 'JPEG') {
		options.ext = 'jpg';
	}

	if(!file || !file.path) {
		return cb(new Error('File is undefined'));
	}

	var image = gm(file.path);
	if(!image) {
		return cb(new Error('Image is not a image'));
	}

	image.size(function (err, size) {
		if(err) {
			return cb(err);
		}

		var changed = false;

		if(options.minWidth && options.minWidth>size.width) {
			return cb(new Error('Image has smaller width'));
		}

		if(options.minHeight && options.minHeight>size.height) {
			return cb(new Error('Image has smaller height'));
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
			return _this.storeUploadedFile(file, options, cb);
		}

		var newPath = file.path + '.changed';
		image.write(newPath, function (err) {
	  		if (err) {
	  			return cb(err);
	  		};
			
			//remove old file
	  		fs.unlink(file.path, function (err) {
	  			if (err) {
		  			return cb(err);
		  		};

		  		var stats = fs.statSync(newPath);
	  			file.size = stats['size'];
	  			file.path = newPath;
				file.originalFilename = useExt(file.originalFilename, options.ext);

				_this.storeUploadedFile(file, options, cb);
		  	});
		});
	});
}

function toPrivateJSON() {
	var data = this.toJSON();
	data.id = data._id;

	delete data._id;
	delete data.__v;

	return data;
}

function createSchema(Schema) {
	var schema = new Schema({
		fileName    : { type: String, required: true, unique: true, index: true },
		name        : { type: String, required: true },
		version     : { type: String },
		ext         : { type: String },
		path        : { type: String },
		size        : { type: Number, required: true },
		isTemporary : { type: Boolean, default: true },
		created     : { type: Date, default: Date.now }
	});

	schema.pre('remove', function(next) {
		if(!this.path) {
			return next();
		}

		fs.unlink(this.path, function (err) {
			if(err && err.message.indexOf('ENOENT') === -1) {
				return next(err);
			};

			next();
		});
	});

	schema.statics.storeUploadedFile = storeUploadedFile;
	schema.statics.storeUploadedImage = storeUploadedImage;
	
	schema.statics.fileNameToDirs = fileNameToDirs;

	schema.methods.toPrivateJSON = toPrivateJSON;

	return schema;
}

exports.createModel = function(db) {
	return db.model('File', createSchema(db.mongoose.Schema));   
};