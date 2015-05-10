import FB from 'fb';
import WebError from 'web-error';

const fbScope = ['email', 'publish_actions'];
const fbSuccessRedirect = '/';
const fbFailureRedirect = '/?fb_error=signin';
const fbAuthUrl = '/auth/facebook';
const fbCallbackUrl = '/auth/facebook/callback';
const fbCanvasRedirectUrl = '/auth/facebook/autologin';

export function ensure(req, res, next) {
	req.server.secure.authenticate('facebook', {
		scope: fbScope,
		failureRedirect: fbFailureRedirect,
		callbackURL: req.protocolHost+fbCallbackUrl
	})(req, res, next);
}

export function ensureCallback(req, res, next) {
	req.server.secure.authenticate('facebook', {
		successRedirect: fbSuccessRedirect,
		failureRedirect: fbFailureRedirect,
		callbackURL: req.protocolHost+fbCallbackUrl,
	})(req, res, next);
}

export function ensureCanvas(req, res, next) {
	req.server.secure.authenticate('facebook-canvas', {
		scope: fbScope,
		successRedirect: fbSuccessRedirect,
		failureRedirect: fbCanvasRedirectUrl,
		callbackURL: req.protocolHost+fbCallbackUrl
	})(req, res, next);
}

/**
 * Redirect unauthorized facebook canvas application to the facebook ensure page
 * @param  {Request} req
 * @param  {Response} res
 */
export function redirectToEnsure(req, res, next) {
  res.send( '<!DOCTYPE html>' +
			  '<body>' +
				'<script type="text/javascript">' +
				  'top.location.href = "'+ fbAuthUrl +'";' +
				'</script>' +
			  '</body>' +
			'</html>' );
}

/**
 * Channel for facebook API
 */
export function channel(req, res, next) {
	const oneYear = 31536000;
	res.set({
		'Pragma': 'public',
		'Cache-Control': 'max-age=' + oneYear,
		'Expires': new Date(Date.now() + oneYear * 1000).toUTCString()
	});

	res.send('<script src="//connect.facebook.net/en_US/all.js"></script>');
}

export function ensureBySignedRequest(req, res, next) {
	if(!req.body.signedRequest || !req.body.profile) {
		return next(new WebError(400));
	}

	const User = req.models.User;
	const options = req.server.options;
	const profile = req.body.profile;

	const session = req.body.session || false;
	const signedRequest  = FB.parseSignedRequest(req.body.signedRequest, options.facebook.appSecret);

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
			return req.logIn(user, { session }, next);
		}

		if(!options.registration.simple) {
			return next(new WebError(400, 'User needs to be registered'));
		}

		if(profile.id != signedRequest.user_id) {
			return next(new WebError(400, 'Profile.id is different from signedRequest.user_id'));
		}

		User.createByFacebook(profile, function(err, user) {
			if(err) {
				return next(err);
			}
			
			req.logIn(user, { session }, next);
		});
	});
}

export function redirectPeopleToCanvas(req, res, next) {
	const facebookBot = 'facebookexternalhit';
	const options = req.server.options;

	if(!req.headers['user-agent'] || req.headers['user-agent'].indexOf(facebookBot) === -1) {
		return res.redirect(302, 'https://apps.facebook.com/' + options.facebook.namespace + '/');
	}

	next();
}