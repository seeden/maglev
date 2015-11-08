import jwt from 'jsonwebtoken';
import async from 'async';
import WebError from 'web-error';
import ok from 'okay';

export function tokenToUser(req, res, next, id) {
  const User = req.models.User;
  const options = req.server.options;

  if (!id) {
    return next(new WebError(400, 'Token is undefined'));
  }

  jwt.verify(id, options.mail.token.secret, ok(next, (data) => {
    if (!data.user) {
      return next(new WebError(400, 'Unknown user'));
    }

    User.findById(id, ok(next, (user) => {
      if (!user) {
        return next(new WebError(404));
      }

      req.objects.user = user;
      next();
    }));
  }));
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
    user.setPassword(req.body.password, ok(next, () => {
      res.status(204).end();
    }));
  } else {
    if (!req.body.password_old) {
      return next(new WebError(400, 'Parameter password_old is missing'));
    }

    user.comparePassword(req.body.password_old, ok(next, (isMatch) => {
      if (!isMatch) {
        return next(new WebError(400, 'Password is not match with actual password'));
      }

      user.setPassword(req.body.password, ok(next, () => {
        res.status(204).end();
      }));
    }));
  }
}

export function generateForgotToken(user, tokenSecret, expiresInMinutes = 60 * 24) {
  if (!tokenSecret) {
    throw new Error('Token secret is undefined');
  }

  const data = {
    user: user._id,
  };

  return jwt.sign(data, tokenSecret, { expiresInMinutes });
}

export function forgot(req, res, next) {
  const User = req.models.User;
  const server = req.server;
  const options = server.options;
  const mail = server.mail;

  if (!req.body.username) {
    return next(new WebError(400, 'Parameter username is missing'));
  }

  User.findByUsername(req.body.username, false, ok(next, (user) => {
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
      user,
      from: options.mail.default.from,
      to: user.email,
      subject: 'Password Assistance',
      token,
    };

    async.series({
      html: (callback) => {
        res.render('mail/forgot', data, callback);
      },
      text: (callback) => {
        res.render('mail/forgot_plain', data, callback);
      },
    }, ok(next, (result) => {
      const mailOptions = {
        from: options.mail.default.from,
        to: user.email,
        subject: 'Password Assistance',
        html: result.html,
        text: result.text,
      };

      mail.sendMail(mailOptions, ok(next, () => {
        return res.status(204).end();
      }));
    }));
  }));
}
