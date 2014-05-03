'use strict';

var RBAC = require('rbac');

exports.prepare = function() {
	return new RBAC();
};