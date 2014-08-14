'use strict';

var Puid = require('puid'),
	path = require('path'),
	fs = require('fs'),
	mv = require('mv'),
	_ = require('underscore');

var puid = new Puid(true);

var name = exports.name = 'File';

var DIRS_COUNT = 2;
var DIR_LENGTH = 3;
var DIRECTORY_SEPARATOR = '/';

function fileNameToDirsLocal(){
	return fileNameToDirs(this.fileName);
}

function fileNameToDirs(fileName) {
	var chunks = fileName.match(new RegExp('.{1,'+DIR_LENGTH+'}', 'g'));
	var dirs = chunks.slice(0, DIRS_COUNT);	

	return dirs.join(DIRECTORY_SEPARATOR);
}

function getPath(fileName, basePath, addFileName) {
	if(!basePath || !fileName) {
		throw new Error('Parameter is undefined');
	}

	var minSize = DIR_LENGTH*DIRS_COUNT;
	if(fileName.length<minSize) {
		return null;
	}

	var dirs = fileNameToDirs(fileName);

	var path = basePath + DIRECTORY_SEPARATOR + dirs;

	if(addFileName) {
		path += DIRECTORY_SEPARATOR + fileName;
	}

	return path;
}

function genUniqueName(ext) {
	var fileName = puid.generate();
	fileName = fileName.split('').reverse().join('');
	return fileName;
}

function getExtension(filename) {
	if(!filename) {
		return null;
	}

    var ext = path.extname(filename||'').split('.');
    return ext[ext.length - 1];
}

var findByID = exports.findByID = function(id, cb) {
	return this.findOne({_id: id}).exec(cb);	
};

var updateMultiple = exports.updateMultiple = function(data, cb) {
	this.set(data).save(cb);
};

var getPublicJSON = exports.getPublicJSON = function() {
	var json = this.toJSON();
	return json;
};

var createFile = exports.createFile = function(file, basePath, data, cb) {
	var File = this.model(name);

	var originalFilename = file['originalFilename'];

	data = data || {};
	data.ext = getExtension(originalFilename);
	data.name = genUniqueName();
	data.fileName = data.name;
	data.size = file.size;

	if(data.ext) {
		data.fileName+='.'+data.ext;
	}

	var newPath = getPath(data.fileName, basePath, true);

	mv(file.path, newPath, {mkdirp: true}, function (err) {
		if(err) {
			return cb(err);
		}

		var file = new File(data);
		return file.save(function(err, file) {
			if(err || !file) {
				return cb(err, file);
			}

			File.findByID(file.id, cb);
		});
	});
};

var createSchema = exports.createSchema = function (Schema) {

	var schema = new Schema({
		fileName    : { type: String, required: true, unique: true },
		name        : { type: String, required: true },
		version     : { type: String },
		ext         : { type: String },
		size        : { type: Number, required: true },
		isTemporary : { type: Boolean, default: true },
		created     : { type: Date, default: Date.now }
	});

	schema.statics.findByID = findByID;
	schema.statics.createFile = createFile;

	schema.statics.fileNameToDirs = fileNameToDirs;

	schema.methods.getPublicJSON = getPublicJSON;
	schema.methods.updateMultiple = updateMultiple;
	schema.methods.fileNameToDirs = fileNameToDirsLocal;

	return schema;
};

var createModel = exports.createModel = function(db) {
	return db.model(name, createSchema(db.mongoose.Schema));   
};