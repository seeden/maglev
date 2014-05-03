var swig = require('swig');

/*add dojo props*/
function dojoProps (input) {
	var data = JSON.stringify(input);

	if(data[0] === '{') {
		data = data.substring(1,data.length-1);
	}
	return data;
}
dojoProps.safe = true;

/*add link props*/
function link(url, req) {
	return req.protocolHost + url;
}
link.safe = true;

//add filters
swig.setFilter('dojoprops', dojoProps);
swig.setFilter('link', link);

module.exports = function() {};