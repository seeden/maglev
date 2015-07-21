'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.isOwner = isOwner;
exports.user = user;
exports.permalink = permalink;
exports.create = create;
exports.remove = remove;
exports.current = current;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _webError = require('web-error');

var _webError2 = _interopRequireDefault(_webError);

var _tv4 = require('tv4');

var _tv42 = _interopRequireDefault(_tv4);

var _okay = require('okay');

var _okay2 = _interopRequireDefault(_okay);

function isOwner(req, res, next) {
  if (!req.user || !req.objects.user) {
    return next(new _webError2['default'](401));
  }

  if (!req.user.isMe(req.objects.user)) {
    return next(new _webError2['default'](401));
  }

  next();
}

function user(req, res, next, id) {
  var User = req.models.User;

  if (!id) {
    return next(new _webError2['default'](400));
  }

  User.findById(id, (0, _okay2['default'])(next, function (user) {
    if (!user) {
      return next(new _webError2['default'](404));
    }

    req.objects.user = user;
    next();
  }));
}

function permalink(req, res, next, permalink) {
  var User = req.models.User;

  if (!permalink) {
    return next(new _webError2['default'](400));
  }

  User.findOne({
    permalink: permalink
  }, (0, _okay2['default'])(next, function (user) {
    if (!user) {
      return next(new _webError2['default'](404));
    }

    req.objects.user = user;
    next();
  }));
}

/**
 * Create user by simple registraion
 */

function create(req, res, next) {
  var User = req.models.User;
  var options = req.server.options;

  exports.createSchema = exports.createSchema || User.getRestJSONSchema();
  var result = _tv42['default'].validateMultiple(req.body, exports.createSchema);
  if (!result.valid) {
    return next(new _webError2['default'](400, 'Validation errors', result.errors));
  }

  User.create(req.body, (0, _okay2['default'])(next, function (user) {
    if (!user) {
      return next(new Error('User is undefined'));
    }

    res.jsonp({
      token: user.generateBearerToken(options.token.secret, options.token.expiration),
      user: user.toPrivateJSON()
    });
  }));
}

function remove(req, res, next) {
  var user = req.objects.user;
  if (!user) {
    return next(new _webError2['default'](404));
  }

  user.remove((0, _okay2['default'])(next, function () {
    res.status(204).end();
  }));
}

function current(req, res, next) {
  var user = req.user;
  if (!user) {
    return next(new _webError2['default'](404));
  }

  res.jsonp({
    user: user.toPrivateJSON()
  });
}