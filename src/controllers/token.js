import WebError from 'web-error';

export function generateForCurrent(req, res, next) {
	var user = req.user;
	var options = req.server.options;
	var rbac = req.server.rbac;

	if(!user) {
		return next(new WebError(401));
	}

	res.jsonp({
		token: user.generateBearerToken(options.token.secret, options.token.expiration),
		user: user.toPrivateJSON()
	});
}

export function generate(req, res, next) {
	var User = req.models.User;
	var options = req.server.options;
	var rbac = req.server.rbac;

	if(!req.body.username || !req.body.password) {
		return next(new WebError(400, 'One of parameter missing'));
	}

	User.findByUsernamePassword(req.body.username, req.body.password, false, function(err, user) {
		if(err) {
			return next(err);
		}

		if(!user) {
			return next(new WebError(404, 'Invalid username or password'));
		}

		res.jsonp({
			token: user.generateBearerToken(options.token.secret, options.token.expiration),
			user: user.toPrivateJSON()
		});
	});
}

export function invalidate(req, res, next) {
	if(!req.body.access_token) {
		return next(new WebError(400, 'Token is missing'));
	}

	//TODO remove from keystore db and invalidate token
	return res.status(501).jsonp({});
}

export function ensure(req, res, next) {
	req.server.secure.authenticate('bearer', { 
		session: false
	})(req, res, next);
}

export function ensureWithSession(req, res, next) {
	if (req.isAuthenticated() === true) {
		return next(); // already authenticated via session cookie
	}

	req.server.secure.authenticate('bearer', { 
		session: false
	})(req, res, next);
}

export function tryEnsure(req, res, next) {
	req.server.secure.authenticate(['bearer', 'anonymous'], { 
		session: false
	})(req, res, next);
}