'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.tokenToUser = tokenToUser;
exports.change = change;
exports.generateForgotToken = generateForgotToken;
exports.forgot = forgot;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _webError = require('web-error');

var _webError2 = _interopRequireDefault(_webError);

function tokenToUser(req, res, next, id) {
  var User = req.models.User;
  var options = req.server.options;

  if (!id) {
    return next(new _webError2['default'](400, 'Token is undefined'));
  }

  _jsonwebtoken2['default'].verify(id, options.mail.token.secret, function (err, data) {
    if (err) {
      return next(err);
    }

    if (!data.user) {
      return next(new _webError2['default'](400, 'Unknown user'));
    }

    User.findById(id, function (err2, user) {
      if (err2) {
        return next(err2);
      }

      if (!user) {
        return next(new _webError2['default'](404));
      }

      req.objects.user = user;
      next();
    });
  });
}

/**
 * Change user password
 */

function change(req, res, next) {
  var user = req.objects.user;

  if (!user) {
    return next(new _webError2['default'](404));
  }

  if (!req.body.password) {
    return next(new _webError2['default'](400, 'Parameter password is missing'));
  }

  if (!user.hasPassword()) {
    user.setPassword(req.body.password, function (err) {
      if (err) {
        return next(err);
      }

      return res.status(204).end();
    });
  } else {
    if (!req.body.password_old) {
      return next(new _webError2['default'](400, 'Parameter password_old is missing'));
    }

    user.comparePassword(req.body.password_old, function (err, isMatch) {
      if (err) {
        return next(err);
      }

      if (!isMatch) {
        return next(new _webError2['default'](400, 'Password is not match with actual password'));
      }

      user.setPassword(req.body.password, function (err2) {
        if (err2) {
          return next(err2);
        }

        return res.status(204).end();
      });
    });
  }
}

function generateForgotToken(user, tokenSecret) {
  var expiresInMinutes = arguments.length <= 2 || arguments[2] === undefined ? 60 * 24 : arguments[2];

  if (!tokenSecret) {
    throw new Error('Token secret is undefined');
  }

  var data = {
    user: user._id
  };

  return _jsonwebtoken2['default'].sign(data, tokenSecret, { expiresInMinutes: expiresInMinutes });
}

function forgot(req, res, next) {
  var User = req.models.User;
  var server = req.server;
  var options = server.options;
  var mail = server.mail;

  if (!req.body.username) {
    return next(new _webError2['default'](400, 'Parameter username is missing'));
  }

  User.findByUsername(req.body.username, false, function (err, user) {
    if (err) {
      return next(err);
    }

    if (!user) {
      return next(new _webError2['default'](404));
    }

    if (!user.hasEmail()) {
      return next(new _webError2['default'](401, 'User has no email'));
    }

    // generate token
    var token = generateForgotToken(user, options.mail.token.secret, options.mail.token.expiration);

    // render mails
    var data = {
      user: user,
      from: options.mail['default'].from,
      to: user.email,
      subject: 'Password Assistance',
      token: token
    };

    _async2['default'].series({
      html: function html(callback) {
        res.render('mail/forgot', data, callback);
      },
      text: function text(callback) {
        res.render('mail/forgot_plain', data, callback);
      }
    }, function (err2, result) {
      if (err2) {
        return next(new Error(err2));
      }

      var mailOptions = {
        from: options.mail['default'].from,
        to: user.email,
        subject: 'Password Assistance',
        html: result.html,
        text: result.text
      };

      mail.sendMail(mailOptions, function (err3) {
        if (err3) {
          return next(new Error(err3));
        }

        return res.status(204).end();
      });
    });
  });
}