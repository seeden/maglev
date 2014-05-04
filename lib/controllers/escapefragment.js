'use strict';

var WebError = require('web-error'),
	path = require('path'),
	childProcess = require('child_process'),
	phantomjs = require('phantomjs'),
	binPath = phantomjs.path;

exports.snapshot = function(req, res, next) {
	var script = path.join( __dirname, '..', 'scripts', 'gethtml.js');
	var url = req.originalUrl.replace('_escape_fragment_', '#!');
	var childArgs = [script, url];

    childProcess.execFile(binPath, childArgs, function(err, stdout, stderr) {
    	var header = JSON.parse(stdout.substring(0, 256));
    	var content = stdout.substring(256);

    	if(header.status !== 'success') {
    		return next(new WebError(404));
    	}

        res.writeHead( 200, {
            'Content-Type': 'text/html; charset=UTF-8'
        });

        res.end(content);
    });
};