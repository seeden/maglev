'use strict';

var async = require('async');

function pushTasks(q, count) {
	for(var i=0; i<count; i++) {
		q.push(i);
	}
}

exports.run = function(task, parallel, maxProcess, pauseTimeout) {
	parallel = parallel || 5;
	maxProcess = maxProcess || 1000;
	pauseTimeout = pauseTimeout || 3000;

	var startedTasks = 0;

	var q = async.queue(function (id, callback) {
		startedTasks++;

		task(callback);
	});

	q.drain = function() {
		console.log('Already done: ' + startedTasks);

		if(startedTasks>maxProcess && maxProcess !== -1) {
			return process.exit();
		}

		setTimeout(function() {
			pushTasks(q, parallel);
		}, pauseTimeout);
	};

	pushTasks(q, parallel);
}