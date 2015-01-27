'use strict';

var FB = require('fb');
var WebError = require('web-error');

var fbScope = ['email', 'publish_actions'];
var fbSuccessRedirect = '/';
var fbFailureRedirect = '/?fb_error=signin';
var fbAuthUrl = '/auth/facebook';
var fbCallbackUrl = '/auth/facebook/callback';
var fbCanvasRedirectUrl = '/auth/facebook/autologin';


exports.ensure = function(req, res, next) {
	req.server.secure.authenticate('facebook', {
		scope: fbScope,
		failureRedirect: fbFailureRedirect,
		callbackURL: req.protocolHost+fbCallbackUrl
	})(req, res, next);
};

exports.ensureCallback = function(req, res, next) {
	req.server.secure.authenticate('facebook', {
		successRedirect: fbSuccessRedirect,
		failureRedirect: fbFailureRedirect,
		callbackURL: req.protocolHost+fbCallbackUrl,
	})(req, res, next);
};

exports.ensureCanvas = function(req, res, next) {
	req.server.secure.authenticate('facebook-canvas', {
		scope: fbScope,
		successRedirect: fbSuccessRedirect,
		failureRedirect: fbCanvasRedirectUrl,
		callbackURL: req.protocolHost+fbCallbackUrl
	})(req, res, next);
};

/**
 * Redirect unauthorized facebook canvas application to the facebook ensure page
 * @param  {Request} req
 * @param  {Response} res
 */
exports.redirectToEnsure = function(req, res, next) {
  res.send( '<!DOCTYPE html>' +
			  '<body>' +
				'<script type="text/javascript">' +
				  'top.location.href = "'+ fbAuthUrl +'";' +
				'</script>' +
			  '</body>' +
			'</html>' );
};

/**
 * Channel for facebook API
 */
exports.channel = function(req, res, next) {
	var oneYear = 31536000;
	res.set({
		'Pragma': 'public',
		'Cache-Control': 'max-age=' + oneYear,
		'Expires': new Date(Date.now() + oneYear * 1000).toUTCString()
	});

	res.send('<script src="//connect.facebook.net/en_US/all.js"></script>');
};

exports.ensureBySignedRequest = function(req, res, next) {
	if(!req.body.signed_request || !req.body.profile) {
		return next(new WebError(400));
	}

	var User = req.models.User;
	var config = req.server.config;

	var session = req.body.session || false;
	var signedRequest  = FB.parseSignedRequest(req.body.signed_request, config.facebook.clientSecret);

	if(!signedRequest) {
		return next(new WebError(400, 'Parsing signed request'));
	}

	if(!signedRequest.user_id) {
		return next(new WebError(400, 'User ID is missing'));
	}

	//if user is authentificated and ids is same
	if(req.user && req.user.facebook.id === signedRequest.user_id) {
		return next();
	}

	//search user in database
	User.findByFacebookID(signedRequest.user_id, function(err, user) {
		if(err) {
			return next(err);
		}

		if(user) {
			return req.logIn(user, {session: session}, next);
		}

		if(!config.registration.simple) {
			return next(new WebError(400, 'User needs to be registered'));
		}

		User.createByFacebook(req.body.profile, function(err, user) {
			if(err) {
				return next(err);
			}
			
			req.logIn(user, {session: session}, next);
		});
	});
};

exports.redirectPeopleToCanvas = function(req, res, next) {
	var facebookBot = 'facebookexternalhit';
	var config = req.server.config;

	if(!req.headers['user-agent'] || req.headers['user-agent'].indexOf(facebookBot) === -1) {
		return res.redirect(302, 'https://apps.facebook.com/' + config.facebook.namespace + '/');
	}

	next();
};