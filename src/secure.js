import passport from 'passport';
import * as strategy from './strategy';

export default class Secure {
	constructor(server) {
		this._server = server;

		this._prepare();
	}

	get server() {
		return this._server;
	}

	get passport() {
		return passport;
	}

	_prepare() {
		var server = this.server;
		var passport = this.passport;

		passport.serializeUser(function(user, done) {
			done(null, user.id);
		});

		passport.deserializeUser(function(id, done) {
			var User = server.models.User;

			User.findById(id, function(err, user) {
				done(err, user);
			});
		});

		var options = server.options;
		var models = server.models;

		passport.use(strategy.anonymous(options, models));
		passport.use(strategy.local(options, models));
		passport.use(strategy.bearer(options, models));

		options.strategies.forEach(function(strategy) {
			passport.use(strategy(options, models));
		});
	}

	authenticate(...args) {
		var passport = this.passport;
		return passport.authenticate.apply(passport, args);
	}
}