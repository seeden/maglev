var page = require('webpage').create(),
	system = require('system');

var lastChange = startTime = new Date().getTime();

var wait = 500,
	timeout = 5000,
	sended = false,
	checkCompleteTimeoutID = null;

var requests = {
	list: {},
	count: 0,
	finished: 0
};


//when page need something 
page.onResourceRequested = function (request) {
	var id = request.id;

	if(typeof requests.list[id] !== 'undefined') {
		return;
	}

	requests.list[id] = request;
	requests.count++;
	lastChange = new Date().getTime();
};

//when is resource loaded
page.onResourceReceived = function (response) {
	var id = response.id;

	if(typeof requests.list[id] === 'undefined' || requests.list[id] === true) {
		return; 
	}

    requests.list[id] = true;
	requests.finished++;
	lastChange = new Date().getTime();

	checkComplete(true);
};

var sendResponse = function(status) {
	sended = true;

	var headerLength = 256;

	var data = JSON.stringify({
		time: lastChange-startTime,
		status: status
	});

	//write header
	console.log(data);
	console.log(Array(headerLength-data.length).join(" "));

	//write data
	console.log(page.content);
	phantom.exit();
};

var checkComplete = function (afterWait) {
	if(sended) {
		return;
	}

	//prepare timeout
	if(checkCompleteTimeoutID) {
		clearTimeout(checkCompleteTimeoutID);
		checkCompleteTimeoutID = null;
	}

	if(afterWait) {
		checkCompleteTimeoutID = setTimeout(function() {
			checkCompleteTimeoutID = null;
			checkComplete();
		}, wait);

		return;
	}

	//process 
	var now = new Date().getTime();

	//if timeout ellapsed
	if(now-startTime>=timeout) {
		return sendResponse('timeout');
	}

	//if everything processed
	if(requests.count === requests.finished && now-lastChange>=wait) {
		return sendResponse('success');
	}
};


//prepare timeout
setTimeout(function() {
	checkComplete();
}, timeout);


// Open the page
page.open(system.args[1], function (pageStatus) {
	checkComplete(true);
});