'use strict';

exports.or = function(fn1, fn2) {
	return function(req, res, next) {
		fn1(req, res, function(err) {
			if(!err) {
				return next();
			}

			fn2(req, res, next);
		});
	};
};