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

exports.and = function(fn1, fn2) {
	return function(req, res, next) {
		fn1(req, res, function(err) {
			if(!err) {
				return next(err);
			}

			fn2(req, res, next);
		});
	};
};

exports.cond = function(cond, fnOK, fnElse) {
	return function(req, res, next) {
		cond(req, res, function(err) {
			if(!err) {
				return fnOK(req, res, next);
			}

			fnElse(req, res, next);
		});
	};
};