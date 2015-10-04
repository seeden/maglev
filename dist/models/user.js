'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.createSchema = createSchema;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _bcrypt = require('bcrypt');

var _bcrypt2 = _interopRequireDefault(_bcrypt);

var _provider = require('./provider');

var _mongoosePermalink = require('mongoose-permalink');

var _mongoosePermalink2 = _interopRequireDefault(_mongoosePermalink);

var _mongooseHrbac = require('mongoose-hrbac');

var _mongooseHrbac2 = _interopRequireDefault(_mongooseHrbac);

var _mongooseJsonSchema = require('mongoose-json-schema');

var _mongooseJsonSchema2 = _interopRequireDefault(_mongooseJsonSchema);

var _okay = require('okay');

var _okay2 = _interopRequireDefault(_okay);

var name = 'User';

exports.name = name;
// max of 5 attempts, resulting in a 2 hour lock
var SALT_WORK_FACTOR = 10;
// const MAX_LOGIN_ATTEMPTS = 5;
// const LOCK_TIME = 2 * 60 * 60 * 1000;

function toPrivateJSON() {
  var data = this.toJSON({ virtuals: true });
  data.id = data._id;

  delete data._id;
  delete data.__v;

  return data;
}

function getDisplayName() {
  return this.name || this.username;
}

/**
 * Create user by user profile from facebook
 * @param  {Object}   profile Profile from facebook
 * @param  {Function} callback      Callback with created user
 */
function createByFacebook(profile, callback) {
  var _this = this;

  var Provider = this.model('Provider');

  if (!profile.id) {
    return callback(new Error('Profile id is undefined'));
  }

  this.findByFacebookID(profile.id, (0, _okay2['default'])(callback, function (user) {
    if (user) {
      return callback(null, user);
    }

    _this.create({
      username: profile.username || null,
      firstName: profile.first_name,
      lastName: profile.last_name,
      name: profile.name,
      email: profile.email
    }, (0, _okay2['default'])(callback, function (user) {
      user.addProvider('facebook', profile.id, profile, (0, _okay2['default'])(callback, function (provider) {
        callback(null, user);
      }));
    }));
  }));
}

/**
 * Create user by user profile from twitter
 * @param  {Object}   profile Profile from twitter
 * @param  {Function} callback      Callback with created user
 */
function createByTwitter(profile, callback) {
  var _this2 = this;

  var Provider = this.model('Provider');

  if (!profile.id) {
    return callback(new Error('Profile id is undefined'));
  }

  this.findByTwitterID(profile.id, (0, _okay2['default'])(callback, function (user) {
    if (user) {
      return callback(null, user);
    }

    _this2.create({
      username: profile.username || null,
      name: profile.displayName
    }, (0, _okay2['default'])(callback, function (user) {
      user.addProvider('twitter', profile.id, profile, (0, _okay2['default'])(callback, function (provider) {
        callback(null, user);
      }));
    }));
  }));
}

/**
 * Generate access token for actual user
 * @param  {String} Secret for generating of token
 * @param  {[Number]} expiresInMinutes
 * @param  {[Array]} scope List of scopes
 * @return {Object} Access token of user
 */
function generateBearerToken(tokenSecret) {
  var expiresInMinutes = arguments.length <= 1 || arguments[1] === undefined ? 60 * 24 * 14 : arguments[1];
  var scope = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

  if (!tokenSecret) {
    throw new Error('Token secret is undefined');
  }

  var data = {
    user: this._id.toString()
  };

  if (scope.length) {
    data.scope = scope;
  }

  var token = _jsonwebtoken2['default'].sign(data, tokenSecret, {
    expiresInMinutes: expiresInMinutes
  });

  return {
    type: 'Bearer',
    value: token
  };
}

function isMe(user) {
  return user && this._id.toString() === user._id.toString();
}

function findByUsername(username, strict, callback) {
  if (typeof strict === 'function') {
    callback = strict;
    strict = true;
  }

  if (strict) {
    return this.findOne({ username: username }, callback);
  }

  return this.findOne({ $or: [{ username: username }, { email: username }] }, callback);
}

/**
 * Find user by his facebook ID
 * @param  {String}   id Facebook id of user assigned in database
 * @param  {Function} callback
 */
function findByFacebookID(uid, callback) {
  return this.findByProviderUID('facebook', uid, callback);
}

function findByTwitterID(uid, callback) {
  return this.findByProviderUID('twitter', uid, callback);
}

function findByProviderUID(providerName, uid, callback) {
  var Provider = this.model('Provider');

  return Provider.findOne({
    nameUID: (0, _provider.genNameUID)(providerName, uid)
  }).populate('user').exec((0, _okay2['default'])(callback, function (provider) {
    if (!provider) {
      return callback(null, provider);
    }

    return callback(null, provider.user);
  }));
}

/**
 * Find user by his username/email and his password
 * @param  {String}   username  Username or email of user
 * @param  {String}   password Password of user
 * @param  {Function} callback
 */
function findByUsernamePassword(username, password, strict, callback) {
  if (typeof strict === 'function') {
    callback = strict;
    strict = true;
  }

  return this.findByUsername(username, strict, (0, _okay2['default'])(callback, function findByUsernameCallback(user) {
    if (!user) {
      return callback(null, null);
    }

    user.comparePassword(password, (0, _okay2['default'])(callback, function compareCallback(isMatch) {
      if (!isMatch) {
        return callback(null, null);
      }

      callback(null, user);
    }));
  }));
}

function addProvider(providerName, providerUID, data, callback) {
  var _this3 = this;

  var Provider = this.model('Provider');

  this.hasProvider(providerName, providerUID, (0, _okay2['default'])(callback, function (hasProvider) {
    if (hasProvider) {
      return callback(new Error('This provider is already associated to this user'));
    }

    Provider.create({
      user: _this3._id,
      name: providerName,
      uid: providerUID,
      nameUID: (0, _provider.genNameUID)(providerName, providerUID),
      data: JSON.stringify(data)
    }, callback);
  }));
}

function removeProvider(providerName, providerUID, callback) {
  var Provider = this.model('Provider');

  if (!providerName || !providerUID) {
    return callback(new Error('Provider name or uid is undefined'));
  }

  Provider.remove({
    user: this._id,
    nameUID: (0, _provider.genNameUID)(providerName, providerUID)
  }, callback);
}

function getProvider(providerName, providerUID, callback) {
  if (typeof providerUID === 'function') {
    callback = providerUID;
    providerUID = false;
  }

  var Provider = this.model('Provider');
  var query = {
    user: this._id
  };

  if (!providerUID) {
    query.name = providerName;
  } else {
    query.nameUID = (0, _provider.genNameUID)(providerName, providerUID);
  }

  return Provider.findOne(query, callback);
}

function hasProvider(providerName, providerUID, callback) {
  this.getProvider(providerName, providerUID, (0, _okay2['default'])(callback, function (provider) {
    callback(null, !!provider);
  }));
}

/**
 * Compare user entered password with stored user's password
 * @param  {String}   candidatePassword
 * @param  {Function} callback
 */
function comparePassword(candidatePassword, callback) {
  _bcrypt2['default'].compare(candidatePassword, this.password, function compareCallback(err, isMatch) {
    if (err) {
      return callback(err);
    }

    callback(null, isMatch);
  });
}

function hasPassword() {
  return !!this.password;
}

function setPassword(password, callback) {
  this.password = password;
  return this.save(callback);
}

function hasEmail() {
  return !!this.email ? true : false;
}

function setEmail(email, callback) {
  this.email = email;
  return this.save(callback);
}

function hasUsername() {
  return !!this.username;
}

function setUsername(username, callback) {
  this.username = username;
  return this.save(callback);
}

/*
function incLoginAttempts(callback) {
    // if we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.update({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        }, callback);
    }
    // otherwise we're incrementing
    var updates = {
      $inc: {
        loginAttempts: 1
      }
    };

    // lock the account if we've reached max attempts and it's not locked already
    if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
        updates.$set = {
          lockUntil: Date.now() + LOCK_TIME
        };
    }

    return this.update(updates, callback);
}*/

/**
 * Create schema for model
 * @param  {mongoose.Schema} Schema
 * @return {mongoose.Schema} User Instance of user schema
 */

function createSchema(Schema) {
  // add properties to schema
  var schema = new Schema({
    firstName: { type: String },
    lastName: { type: String },
    name: { type: String },

    email: { type: String, unique: true, sparse: true },
    username: { type: String, unique: true, sparse: true },

    password: { type: String },

    loginAttempts: { type: Number, required: true, 'default': 0 },
    lockUntil: { type: Number }
  });

  // add indexes
  //schema.index({'providers.name': 1, 'providers.id': 1});
  //schema.index({'providers.nameUID': 1}, { unique: true, sparse: true });

  schema.virtual('isLocked').get(function isLocked() {
    // check for a future lockUntil timestamp
    return !!(this.lockUntil && this.lockUntil > Date.now());
  });

  schema.pre('validate', function validate(next) {
    var user = this;

    // update name
    if ((user.isModified('firstName') || user.isModified('lastName')) && !user.isModified('name')) {
      if (user.firstName && user.lastName) {
        user.name = user.firstName + ' ' + user.lastName;
      } else {
        user.name = user.firstName || user.lastName;
      }
    }

    next();
  });

  // add preprocess validation
  schema.pre('save', function save(next) {
    var user = this;

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) {
      return next();
    }

    // hash the password using our new salt
    _bcrypt2['default'].hash(user.password, SALT_WORK_FACTOR, function hashCallback(err, hash) {
      if (err) {
        return next(err);
      }

      // override the cleartext password with the hashed one
      user.password = hash;
      next();
    });
  });

  // add RBAC permissions
  schema.plugin(_mongooseHrbac2['default'], {});

  // add permalink
  schema.plugin(_mongoosePermalink2['default'], {
    sources: ['name', 'firstName', 'lastName', 'username'],
    pathOptions: {
      restExclude: true
    }
  });

  schema.plugin(_mongooseJsonSchema2['default'], {});

  schema.methods.generateBearerToken = generateBearerToken;

  // auth
  schema.methods.isMe = isMe;

  // password
  schema.methods.hasPassword = hasPassword;
  schema.methods.setPassword = setPassword;
  schema.methods.comparePassword = comparePassword;
  // schema.methods.incLoginAttempts = incLoginAttempts;

  // email
  schema.methods.hasEmail = hasEmail;
  schema.methods.setEmail = setEmail;

  // username
  schema.methods.hasUsername = hasUsername;
  schema.methods.setUsername = setUsername;

  // create
  schema.statics.createByFacebook = createByFacebook;
  schema.statics.createByTwitter = createByTwitter;

  // search
  schema.statics.findByUsername = findByUsername;
  schema.statics.findByUsernamePassword = findByUsernamePassword;

  schema.statics.findByProviderUID = findByProviderUID;
  schema.statics.findByFacebookID = findByFacebookID;
  schema.statics.findByTwitterID = findByTwitterID;

  // providers
  schema.methods.addProvider = addProvider;
  schema.methods.removeProvider = removeProvider;
  schema.methods.getProvider = getProvider;
  schema.methods.hasProvider = hasProvider;

  schema.methods.toPrivateJSON = toPrivateJSON;
  schema.methods.getDisplayName = getDisplayName;

  return schema;
}

/*
UserSchema.statics.getAuthenticated = function(username, password, cb) {
    this.findOne({ username: username }, function(err, user) {
        if (err) {
                return cb(err);
        }

        // make sure the user exists
        if (!user) {
                return cb(null, null, reasons.NOT_FOUND);
        }

        // check if the account is currently locked
        if (user.isLocked) {
            // just increment login attempts if account is already locked
            return user.incLoginAttempts(function(err) {
                if (err) return cb(err);
                return cb(null, null, reasons.MAX_ATTEMPTS);
            });
        }

        // test for a matching password
        user.comparePassword(password, function(err, isMatch) {
            if (err) return cb(err);

            // check if the password was a match
            if (isMatch) {
                // if there's no lock or failed attempts, just return the user
                if (!user.loginAttempts && !user.lockUntil) return cb(null, user);
                // reset attempts and lock info
                var updates = {
                    $set: { loginAttempts: 0 },
                    $unset: { lockUntil: 1 }
                };
                return user.update(updates, function(err) {
                    if (err) return cb(err);
                    return cb(null, user);
                });
            }

            // password is incorrect, so increment login attempts before responding
            user.incLoginAttempts(function(err) {
                if (err) return cb(err);
                return cb(null, null, reasons.PASSWORD_INCORRECT);
            });
        });
    });
};
*/