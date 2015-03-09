"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

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
exports.createSchema = createSchema;
exports["default"] = createModel;

var jwt = _interopRequire(require("jsonwebtoken"));

var bcrypt = _interopRequire(require("bcrypt"));

var _ = _interopRequire(require("underscore"));

var provider = _interopRequire(require("./provider"));

var permalink = _interopRequire(require("mongoose-permalink"));

var mongooseHRBAC = _interopRequire(require("mongoose-hrbac"));

var jsonSchemaPlugin = _interopRequire(require("mongoose-json-schema"));

var _mongoose = require("mongoose");

var mongoose = _interopRequire(_mongoose);

var Schema = _mongoose.Schema;

// max of 5 attempts, resulting in a 2 hour lock
var SALT_WORK_FACTOR = 10;
var MAX_LOGIN_ATTEMPTS = 5;
var LOCK_TIME = 2 * 60 * 60 * 1000;

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
	var data = {
		username: profile.username || null,
		firstName: profile.first_name,
		lastName: profile.last_name,
		name: profile.name,
		email: profile.email,
		providers: [{
			name: "facebook",
			uid: profile.id,
			nameUID: provider.genNameUID("facebook", profile.id),
			data: profile
		}]
	};

	return this.create(data, cb);
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
			name: "twitter",
			uid: profile.id,
			nameUID: provider.genNameUID("twitter", profile.id),
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
function generateBearerToken(tokenSecret, expiresInMinutes, scope) {
	if (!tokenSecret) {
		throw new Error("Token secret is undefined");
	}

	scope = scope || [];

	expiresInMinutes = expiresInMinutes || 60 * 24 * 14;

	var data = {
		user: this._id
	};

	if (scope.length) {
		data.scope = scope;
	}

	var token = jwt.sign(data, tokenSecret, {
		expiresInMinutes: expiresInMinutes
	});

	return {
		type: "Bearer",
		value: token
	};
}

function isMe(user) {
	return user && this._id.toString() === user._id.toString();
}

function findByUsername(username, strict, cb) {
	if (typeof strict === "function") {
		cb = strict;
		strict = true;
	}

	if (strict) {
		return this.findOne({ username: username }).exec(cb);
	} else {
		return this.findOne({ $or: [{ username: username }, { email: username }] }).exec(cb);
	}
}

/**
 * Find user by his facebook ID
 * @param  {String}   id Facebook id of user assigned in database
 * @param  {Function} cb
 */
function findByFacebookID(uid, cb) {
	return this.findByProviderUID("facebook", uid, cb);
}

function findByTwitterID(uid, cb) {
	return this.findByProviderUID("twitter", uid, cb);
}

function findByProviderUID(providerName, uid, cb) {
	return this.findOne({
		"providers.nameUID": provider.genNameUID(providerName, uid)
	}).exec(cb);
}

/**
 * Find user by his username/email and his password
 * @param  {String}   username  Username or email of user
 * @param  {String}   password Password of user
 * @param  {Function} cb
 */
function findByUsernamePassword(username, password, strict, cb) {
	if (typeof strict === "function") {
		cb = strict;
		strict = true;
	}

	return this.findByUsername(username, strict, function (err, user) {
		if (err) {
			return cb(err);
		}

		if (!user) {
			return cb(null, null);
		}

		user.comparePassword(password, function (err, isMatch) {
			if (err) {
				return cb(err);
			}

			if (!isMatch) {
				return cb(null, null);
			}

			cb(null, user);
		});
	});
}

function addProvider(name, uid, data, cb) {
	if (!name || !uid) {
		return cb(new Error("Provider name or uid is undefined"));
	}

	if (this.hasProvider(name, uid) !== false) {
		return cb(new Error("This provider is already associated to this user"));
	}

	var providerData = {
		name: name,
		uid: uid,
		nameUID: provider.genNameUID(name, uid),
		data: data
	};

	this.providers.push(providerData);
	return this.save(cb);
}

function removeProvider(name, uid, cb) {
	if (!name || !uid) {
		return cb(new Error("Provider name or uid is undefined"));
	}

	var removed = false;
	var nameUID = provider.genNameUID(name, uid);

	for (var i = 0; i < this.providers.length; i++) {
		var providerData = this.providers[i];

		if (providerData.nameUID === nameUID) {
			this.providers.splice(i, 1);
			removed = true;
			break;
		}
	}

	if (!removed) {
		return cb(new Error("This provider is not associated to this user"));
	}

	return this.save(cb);
}

function getProvider(providerName, providerUID) {
	for (var i = 0; i < this.providers.length; i++) {
		var provider = this.providers[i];

		if (provider.name === providerName) {
			if (providerUID && provider.uid !== providerUID) {
				continue;
			}

			return provider;
		}
	}

	return null;
}

function hasProvider(providerName, providerUID) {
	return this.getProvider(providerName, providerUID) !== null;
}

function getProvidersNameUIDs() {
	var providers = [];

	for (var i = 0; i < this.providers.length; i++) {
		var provider = this.providers[i];
		providers.push(provider.nameUID);
	}

	return providers;
}

/**
 * Compare user entered password with stored user's password
 * @param  {String}   candidatePassword 
 * @param  {Function} cb                
 */
function comparePassword(candidatePassword, cb) {
	bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
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
function createSchema() {
	var providerSchema = provider.createSchema();

	//add properties to schema
	var schema = new Schema({
		firstName: { type: String },
		lastName: { type: String },
		name: { type: String },

		email: { type: String, unique: true, sparse: true },
		username: { type: String, unique: true, sparse: true },

		password: { type: String },

		loginAttempts: { type: Number, required: true, "default": 0 },
		lockUntil: { type: Number },

		providers: [providerSchema]
	});

	//add indexes
	schema.index({ "providers.name": 1, "providers.id": 1 });
	schema.index({ "providers.nameUID": 1 }, { unique: true, sparse: true });

	schema.virtual("isLocked").get(function () {
		// check for a future lockUntil timestamp
		return !!(this.lockUntil && this.lockUntil > Date.now());
	});

	schema.pre("validate", function (next) {
		var user = this;

		//update name
		if ((user.isModified("firstName") || user.isModified("lastName")) && !user.isModified("name")) {
			if (user.firstName && user.lastName) {
				user.name = user.firstName + " " + user.lastName;
			} else {
				user.name = user.firstName || user.lastName;
			}
		}

		next();
	});

	//add preprocess validation
	schema.pre("save", function (next) {
		var user = this;

		// only hash the password if it has been modified (or is new)
		if (!user.isModified("password")) {
			return next();
		}

		// hash the password using our new salt
		bcrypt.hash(user.password, SALT_WORK_FACTOR, function (err, hash) {
			if (err) {
				return next(err);
			}

			// override the cleartext password with the hashed one
			user.password = hash;
			next();
		});
	});

	//add RBAC permissions
	schema.plugin(mongooseHRBAC, {});

	//add permalink
	schema.plugin(permalink, {
		sources: ["name", "firstName", "lastName", "username"],
		pathOptions: {
			restExclude: true
		}
	});

	schema.plugin(jsonSchemaPlugin, {});

	schema.methods.generateBearerToken = generateBearerToken;

	//auth
	schema.methods.isMe = isMe;

	//password
	schema.methods.hasPassword = hasPassword;
	schema.methods.setPassword = setPassword;
	schema.methods.comparePassword = comparePassword;
	//schema.methods.incLoginAttempts = incLoginAttempts;

	//email
	schema.methods.hasEmail = hasEmail;
	schema.methods.setEmail = setEmail;

	//username
	schema.methods.hasUsername = hasUsername;
	schema.methods.setUsername = setUsername;

	//create
	schema.statics.createByFacebook = createByFacebook;

	//search
	schema.statics.findByUsername = findByUsername;
	schema.statics.findByUsernamePassword = findByUsernamePassword;

	schema.statics.findByProviderUID = findByProviderUID;
	schema.statics.findByFacebookID = findByFacebookID;

	//providers
	schema.methods.addProvider = addProvider;
	schema.methods.removeProvider = removeProvider;
	schema.methods.getProvider = getProvider;
	schema.methods.hasProvider = hasProvider;
	schema.methods.getProvidersNameUIDs = getProvidersNameUIDs;

	schema.methods.toPrivateJSON = toPrivateJSON;
	schema.methods.getDisplayName = getDisplayName;

	return schema;
}

function createModel(server) {
	return server.db.model("User", createSchema());
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

Object.defineProperty(exports, "__esModule", {
	value: true
});