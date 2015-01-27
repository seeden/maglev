var page = require('webpage').create(),
var system = require('system');

var lastChange = startTime = new Date().getTime();

var wait = 500;
var timeout = 5000;
var sended = false;
var checkCompleteTimeoutID = null;

var requests = {
	list: {},
	count: 0,
	finished: 0
};

//prepare page
page.settings.loadImages = false;
page.settings.localToRemoteUrlAccessEnabled = true;

page.onInitialized = function() {
	page.evaluate(function() {
		document.addEventListener('_htmlReady', function() {
			window.callPhantom();
		}, false);
	});
};

page.onCallback = function() {
	sendResponse('success');
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
	if(sended) {
		return;
	}

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
	//page_content = noEscape ? page.content.replace(/#!/g, '') : page.content.replace(/#!/g, '/?_escaped_fragment_=');
	console.log(page.content);
	page.close();
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