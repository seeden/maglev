'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.createSchema = createSchema;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _bcrypt = require('bcrypt');

var _bcrypt2 = _interopRequireDefault(_bcrypt);

var _provider = require('./provider');

var provider = _interopRequireWildcard(_provider);

var _mongoosePermalink = require('mongoose-permalink');

var _mongoosePermalink2 = _interopRequireDefault(_mongoosePermalink);

var _mongooseHrbac = require('mongoose-hrbac');

var _mongooseHrbac2 = _interopRequireDefault(_mongooseHrbac);

var _mongooseJsonSchema = require('mongoose-json-schema');

var _mongooseJsonSchema2 = _interopRequireDefault(_mongooseJsonSchema);

var _async = require('async');

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
 * @param  {Function} cb      Callback with created user
 */
function createByFacebook(profile, cb) {
  var _this = this;

  if (!profile.id) {
    return cb(new Error('Profile id is undefined'));
  }

  var data = {
    username: profile.username || null,
    firstName: profile.first_name,
    lastName: profile.last_name,
    name: profile.name,
    email: profile.email,
    providers: [{
      name: 'facebook',
      uid: profile.id,
      nameUID: provider.genNameUID('facebook', profile.id),
      data: profile
    }]
  };

  (0, _async.waterfall)([function (callback) {
    if (!profile.email) {
      return callback(null);
    }

    _this.findOne({
      email: profile.email
    }, function findOneCallback(err, user) {
      if (err) {
        return callback(err);
      }

      if (user) {
        return callback(new Error('User with this email already exists'));
      }

      callback(null);
    });
  }, function (callback) {
    return _this.create(data, callback);
  }], cb);
}

/**
 * Create user by user profile from twitter
 * @param  {Object}   profile Profile from twitter
 * @param  {Function} cb      Callback with created user
 */
function createByTwitter(profile, cb) {
  var data = {
    username: profile.username || null,
    name: profile.displayName,
    providers: [{
      name: 'twitter',
      uid: profile.id,
      nameUID: provider.genNameUID('twitter', profile.id),
      data: profile
    }]
  };

  return this.create(data, cb);
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

function findByUsername(username, strict, cb) {
  if (typeof strict === 'function') {
    cb = strict;
    strict = true;
  }

  if (strict) {
    return this.findOne({ username: username }, cb);
  }

  return this.findOne({ $or: [{ username: username }, { email: username }] }, cb);
}

/**
 * Find user by his facebook ID
 * @param  {String}   id Facebook id of user assigned in database
 * @param  {Function} cb
 */
function findByFacebookID(uid, cb) {
  return this.findByProviderUID('facebook', uid, cb);
}

function findByTwitterID(uid, cb) {
  return this.findByProviderUID('twitter', uid, cb);
}

function findByProviderUID(providerName, uid, cb) {
  return this.findOne({
    'providers.nameUID': provider.genNameUID(providerName, uid)
  }, cb);
}

/**
 * Find user by his username/email and his password
 * @param  {String}   username  Username or email of user
 * @param  {String}   password Password of user
 * @param  {Function} cb
 */
function findByUsernamePassword(username, password, strict, cb) {
  if (typeof strict === 'function') {
    cb = strict;
    strict = true;
  }

  return this.findByUsername(username, strict, function findByUsernameCallback(err, user) {
    if (err) {
      return cb(err);
    }

    if (!user) {
      return cb(null, null);
    }

    user.comparePassword(password, function compareCallback(err2, isMatch) {
      if (err2) {
        return cb(err2);
      }

      if (!isMatch) {
        return cb(null, null);
      }

      cb(null, user);
    });
  });
}

function addProvider(providerName, uid, data, cb) {
  if (!providerName || !uid) {
    return cb(new Error('Provider name or uid is undefined'));
  }

  if (this.hasProvider(providerName, uid) !== false) {
    return cb(new Error('This provider is already associated to this user'));
  }

  var providerData = {
    name: providerName,
    uid: uid,
    nameUID: provider.genNameUID(providerName, uid),
    data: data
  };

  this.providers.push(providerData);
  return this.save(cb);
}

function removeProvider(providerName, uid, cb) {
  var _this2 = this;

  if (!providerName || !uid) {
    return cb(new Error('Provider name or uid is undefined'));
  }

  var removed = false;
  var nameUID = provider.genNameUID(providerName, uid);

  this.providers.forEach(function (p, index) {
    if (p.nameUID !== nameUID) {
      return;
    }

    _this2.providers.splice(index, 1);
    removed = true;
  });

  if (!removed) {
    return cb(new Error('This provider is not associated to this user'));
  }

  return this.save(cb);
}

function getProvider(providerName, providerUID) {
  var providers = this.providers.filter(function filter(p) {
    if (p.name !== providerName) {
      return false;
    }

    if (providerUID && p.uid !== providerUID) {
      return false;
    }

    return true;
  });

  return providers.length ? providers[0] : null;
}

function hasProvider(providerName, providerUID) {
  return !!this.getProvider(providerName, providerUID);
}

function getProvidersNameUIDs() {
  return this.providers.map(function eachProvider(p) {
    return p.nameUID;
  });
}

/**
 * Compare user entered password with stored user's password
 * @param  {String}   candidatePassword
 * @param  {Function} cb
 */
function comparePassword(candidatePassword, cb) {
  _bcrypt2['default'].compare(candidatePassword, this.password, function compareCallback(err, isMatch) {
    if (err) {
      return cb(err);
    }

    cb(null, isMatch);
  });
}

function hasPassword() {
  return !!this.password;
}

function setPassword(password, cb) {
  this.password = password;
  return this.save(cb);
}

function hasEmail() {
  return !!this.email ? true : false;
}

function setEmail(email, cb) {
  this.email = email;
  return this.save(cb);
}

function hasUsername() {
  return !!this.username;
}

function setUsername(username, cb) {
  this.username = username;
  return this.save(cb);
}

/*
function incLoginAttempts(cb) {
    // if we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.update({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        }, cb);
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

    return this.update(updates, cb);
}*/

/**
 * Create schema for model
 * @param  {mongoose.Schema} Schema
 * @return {mongoose.Schema} User Instance of user schema
 */

function createSchema(Schema) {
  var providerSchema = provider.createSchema(Schema);

  // add properties to schema
  var schema = new Schema({
    firstName: { type: String },
    lastName: { type: String },
    name: { type: String },

    email: { type: String, unique: true, sparse: true },
    username: { type: String, unique: true, sparse: true },

    password: { type: String },

    loginAttempts: { type: Number, required: true, 'default': 0 },
    lockUntil: { type: Number },

    providers: [providerSchema]
  });

  // add indexes
  schema.index({ 'providers.name': 1, 'providers.id': 1 });
  schema.index({ 'providers.nameUID': 1 }, { unique: true, sparse: true });

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
  schema.methods.getProvidersNameUIDs = getProvidersNameUIDs;

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