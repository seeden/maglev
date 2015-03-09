"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

exports.ensure = ensure;
exports.ensureCallback = ensureCallback;
exports.ensureCanvas = ensureCanvas;

/**
 * Redirect unauthorized facebook canvas application to the facebook ensure page
 * @param  {Request} req
 * @param  {Response} res
 */
exports.redirectToEnsure = redirectToEnsure;

/**
 * Channel for facebook API
 */
exports.channel = channel;
exports.ensureBySignedRequest = ensureBySignedRequest;
exports.redirectPeopleToCanvas = redirectPeopleToCanvas;

var FB = _interopRequire(require("fb"));

var WebError = _interopRequire(require("web-error"));

var fbScope = ["email", "publish_actions"];
var fbSuccessRedirect = "/";
var fbFailureRedirect = "/?fb_error=signin";
var fbAuthUrl = "/auth/facebook";
var fbCallbackUrl = "/auth/facebook/callback";
var fbCanvasRedirectUrl = "/auth/facebook/autologin";

function ensure(req, res, next) {
	req.server.secure.authenticate("facebook", {
		scope: fbScope,
		failureRedirect: fbFailureRedirect,
		callbackURL: req.protocolHost + fbCallbackUrl
	})(req, res, next);
}

function ensureCallback(req, res, next) {
	req.server.secure.authenticate("facebook", {
		successRedirect: fbSuccessRedirect,
		failureRedirect: fbFailureRedirect,
		callbackURL: req.protocolHost + fbCallbackUrl })(req, res, next);
}

function ensureCanvas(req, res, next) {
	req.server.secure.authenticate("facebook-canvas", {
		scope: fbScope,
		successRedirect: fbSuccessRedirect,
		failureRedirect: fbCanvasRedirectUrl,
		callbackURL: req.protocolHost + fbCallbackUrl
	})(req, res, next);
}

function redirectToEnsure(req, res, next) {
	res.send("<!DOCTYPE html>" + "<body>" + "<script type=\"text/javascript\">" + "top.location.href = \"" + fbAuthUrl + "\";" + "</script>" + "</body>" + "</html>");
}

function channel(req, res, next) {
	var oneYear = 31536000;
	res.set({
		Pragma: "public",
		"Cache-Control": "max-age=" + oneYear,
		Expires: new Date(Date.now() + oneYear * 1000).toUTCString()
	});

	res.send("<script src=\"//connect.facebook.net/en_US/all.js\"></script>");
}

function ensureBySignedRequest(req, res, next) {
	if (!req.body.signed_request || !req.body.profile) {
		return next(new WebError(400));
	}

	var User = req.models.User;
	var options = req.server.options;

	var session = req.body.session || false;
	var signedRequest = FB.parseSignedRequest(req.body.signed_request, options.facebook.clientSecret);

	if (!signedRequest) {
		return next(new WebError(400, "Parsing signed request"));
	}

	if (!signedRequest.user_id) {
		return next(new WebError(400, "User ID is missing"));
	}

	//if user is authentificated and ids is same
	if (req.user && req.user.facebook.id === signedRequest.user_id) {
		return next();
	}

	//search user in database
	User.findByFacebookID(signedRequest.user_id, function (err, user) {
		if (err) {
			return next(err);
		}

		if (user) {
			return req.logIn(user, { session: session }, next);
		}

		if (!options.registration.simple) {
			return next(new WebError(400, "User needs to be registered"));
		}

		User.createByFacebook(req.body.profile, function (err, user) {
			if (err) {
				return next(err);
			}

			req.logIn(user, { session: session }, next);
		});
	});
}

function redirectPeopleToCanvas(req, res, next) {
	var facebookBot = "facebookexternalhit";
	var options = req.server.options;

	if (!req.headers["user-agent"] || req.headers["user-agent"].indexOf(facebookBot) === -1) {
		return res.redirect(302, "https://apps.facebook.com/" + options.facebook.namespace + "/");
	}

	next();
}

Object.defineProperty(exports, "__esModule", {
	value: true
});