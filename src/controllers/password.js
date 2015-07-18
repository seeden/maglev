import jwt from 'jsonwebtoken';
import async from 'async';
import WebError from 'web-error';

export function tokenToUser(req, res, next, id) {
  const User = req.models.User;
  const options = req.server.options;

  if (!id) {
    return next(new WebError(400, 'Token is undefined'));
  }

  jwt.verify(id, options.mail.token.secret, function(err, data) {
    if (err) {
      return next(err);
    }

    if (!data.user) {
      return next(new WebError(400, 'Unknown user'));
    }


    User.findById(id, function(err2, user) {
      if (err2) {
        return next(err2);
      }

      if (!user) {
        return next(new WebError(404));
      }

      req.objects.user = user;
      next();
    });
  });
}


/**
 * Change user password
 */
export function change(req, res, next) {
  const user = req.objects.user;

  if (!user) {
    return next(new WebError(404));
  }

  if (!req.body.password) {
    return next(new WebError(400, 'Parameter password is missing'));
  }

  if (!user.hasPassword()) {
    user.setPassword(req.body.password, function(err) {
      if (err) {
        return next(err);
      }

      return res.status(204).end();
    });
  } else {
    if (!req.body.password_old) {
      return next(new WebError(400, 'Parameter password_old is missing'));
    }

    user.comparePassword(req.body.password_old, function(err, isMatch) {
      if (err) {
        return next(err);
      }

      if (!isMatch) {
        return next(new WebError(400, 'Password is not match with actual password'));
      }

      user.setPassword(req.body.password, function(err2) {
        if (err2) {
          return next(err2);
        }

        return res.status(204).end();
      });
    });
  }
}

export function generateForgotToken(user, tokenSecret, expiresInMinutes) {
  if (!tokenSecret) {
    throw new Error('Token secret is undefined');
  }

  expiresInMinutes = expiresInMinutes || 60 * 24;

  const data = {
    user: user._id
  };

  return jwt.sign(data, tokenSecret, { expiresInMinutes: expiresInMinutes });
}

export function forgot(req, res, next) {
  const User = req.models.User;
  const server = req.server;
  const options = server.options;
  const mail = server.mail;

  if (!req.body.username) {
    return next(new WebError(400, 'Parameter username is missing'));
  }

  User.findByUsername(req.body.username, false, function(err, user) {
    if (err) {
      return next(err);
    }

    if (!user) {
      return next(new WebError(404));
    }

    if (!user.hasEmail()) {
      return next(new WebError(401, 'User has no email'));
    }

    // generate token
    const token = generateForgotToken(user, options.mail.token.secret, options.mail.token.expiration);

    // render mails
    const data = {
      user: user,
      from: options.mail.default.from,
      to: user.email,
      subject: 'Password Assistance',
      token: token
    };

    async.series({
      html: function(callback) {
        res.render('mail/forgot', data, callback);
      },
      text: function(callback) {
        res.render('mail/forgot_plain', data, callback);
      }
    }, function(err2, result) {
      if (err2) {
        return next(new Error(err2));
      }

      const mailOptions = {
        from: options.mail.default.from,
        to: user.email,
        subject: 'Password Assistance',
        html: result.html,
        text: result.text
      };

      mail.sendMail(mailOptions, function(err3) {
        if (err3) {
          return next(new Error(err3));
        }

        return res.status(204).end();
      });
    });
  });
}
