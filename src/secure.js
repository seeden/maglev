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
    const server = this.server;
    const pp = this.passport;

    pp.serializeUser(function serializeUserCallback(user, done) {
      done(null, user.id);
    });

    pp.deserializeUser(function deserializeUserCallback(id, done) {
      const User = server.models.User;

      User.findById(id, done);
    });

    const options = server.options;
    const models = server.models;

    pp.use(strategy.anonymous(options, models));
    pp.use(strategy.local(options, models));
    pp.use(strategy.bearer(options, models));

    options.strategies.forEach(function eachStrategy(strategy2) {
      pp.use(strategy2(options, models));
    });
  }

  authenticate(...args) {
    const pp = this.passport;
    return pp.authenticate.apply(pp, args);
  }
}
