"use strict";

exports.or = or;
exports.and = and;
exports.cond = cond;

function or(fn1, fn2) {
	return function (req, res, next) {
		fn1(req, res, function (err) {
			if (!err) {
				return next();
			}

			fn2(req, res, next);
		});
	};
}

function and(fn1, fn2) {
	return function (req, res, next) {
		fn1(req, res, function (err) {
			if (!err) {
				return next(err);
			}

			fn2(req, res, next);
		});
	};
}

function cond(cond, fnOK, fnElse) {
	return function (req, res, next) {
		cond(req, res, function (err) {
			if (!err) {
				return fnOK(req, res, next);
			}

			fnElse(req, res, next);
		});
	};
}

Object.defineProperty(exports, "__esModule", {
	value: true
});