'use strict';

var jwt = require('jsonwebtoken'),
	bcrypt = require('bcrypt'),
	_ = require('underscore'),
	provider = require('./provider'),
	permalink = require('mongoose-permalink'),
	mongooseHRBAC = require('mongoose-hrbac');

// max of 5 attempts, resulting in a 2 hour lock
var SALT_WORK_FACTOR = 10;
var MAX_LOGIN_ATTEMPTS = 5;
var LOCK_TIME = 2 * 60 * 60 * 1000;

// expose enum on the model, and provide an internal convenience reference 
var failedLogin = {
    NOT_FOUND: 0,
    PASSWORD_INCORRECT: 1,
    MAX_ATTEMPTS: 2
};

var name = exports.name = 'User';

var getPrivateJSON = exports.getPrivateJSON = function(rbac, cb) {
    var user = this.toJSON();
    var data = {
		id: user._id,
		permalink: user.permalink,

		firstName: user.firstName,
		lastName: user.lastName,
		name: user.name,

		image: user.image,

		email: user.email,
		username: user.username,

		hasPassword: this.hasPassword(),

		providers: user.providers
	};

    this.getScope(rbac, function(err, scope) {
    	if(err) {
    		return cb(err);
    	}

    	data.scope = scope;

    	cb(null, data);
    });
};

var getDisplayName = exports.getDisplayName = function() {
	return this.name || this.username || '';
};

/**
 * Create user by data
 * @param  {Object}   data User data
 * @param  {Function} cb   [description]
 */

/*
var create = exports.create = function(data, cb) {
	var User = this.model(name);

	var user = new User(data);
	user.save(function(err) {
		cb(err, user);
	});
};*/

var updateMultiple = exports.updateMultiple = function(data, cb) {
	return this.set(data).save(cb);
};

/**
 * Create user by user profile from facebook
 * @param  {Object}   profile Profile from facebook
 * @param  {Function} cb      Callback with created user
 */
var createByFacebook = exports.createByFacebook = function(profile, cb) {

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

	return this.create(data, cb);
};

/**
 * Create user by user profile from twitter
 * @param  {Object}   profile Profile from twitter
 * @param  {Function} cb      Callback with created user
 */
var createByTwitter = exports.createByTwitter = function(profile, cb) {

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
};


/**
 * Generate access token for actual user
 * @param  {String} Secret for generating of token
 * @param  {[Number]} expiresInMinutes 
 * @param  {[Array]} scope List of scopes
 * @return {String} Access token of user
 */
var generateAccessToken = exports.generateAccessToken = function(tokenSecret, expiresInMinutes, scope) {
	if(!tokenSecret) {
		throw new Error('Token secret is undefined');
	}

	expiresInMinutes = expiresInMinutes || 60*24*14;

	var data = { 
		userID: this._id,
		scope: scope || []
	};

	return jwt.sign(data, tokenSecret, { expiresInMinutes: expiresInMinutes });
};

var isMe = exports.isMe = function(user) {
	if(user && this._id.equals(user._id)) {
		return true;
	}

	return false;
};

/**
 * Find user by his ID
 * @param  {String}   id ID of user in database
 * @param  {Function} cb
 */
var findByID = exports.findByID = function(id, cb) {
	return this.findOne({
		_id: id
	}).exec(cb);
};

var findByUsername = exports.findByUsername = function(username, strict, cb) {
	if(typeof strict === 'function') {
		cb = strict;
		strict = true;
	}

	if(strict) {
		return this.findOne({username: username}).exec(cb);
	} else {
		return this.findOne({ $or: [
			{ username: username },
			{ email: username }
		]}).exec(cb);
	}
};

var findByPermalink = exports.findByPermalink = function(permalink, cb) {
	return this.findOne({permalink: permalink}).exec(cb);
};

/**
 * Find user by his facebook ID
 * @param  {String}   id Facebook id of user assigned in database
 * @param  {Function} cb
 */
var findByFacebookID = exports.findByFacebookID = function(uid, cb) {
	return this.findByProviderUID('facebook', uid, cb);
};

var findByTwitterID = exports.findByTwitterID = function(uid, cb) {
	return this.findByProviderUID('twitter', uid, cb);
};

var findByProviderUID = exports.findByProviderUID = function(providerName, uid, cb) {
	return this.findOne({
		'providers.nameUID': provider.genNameUID(providerName, uid)
	}).exec(cb);
};

/**
 * Find user by his username/email and his password
 * @param  {String}   username  Username or email of user
 * @param  {String}   password Password of user
 * @param  {Function} cb
 */
var findByUsernamePassword = exports.findByUsernamePassword = function(username, password, strict, cb) {
	if(typeof strict === 'function') {
		cb = strict;
		strict = true;
	}

	return this.findByUsername(username, strict, function(err, user) {
		if(err) {
			return cb(err);
		}

		if(!user) {
			return cb(null, null);
		}

		user.comparePassword(password, function(err, isMatch) {
			if(err) {
				return cb(err);	
			}

			if(!isMatch) {
				return cb(null, null);
			}

			cb(null, user);
		});
	});
};

var addProvider = exports.addProvider = function(name, uid, data, cb) {
	var self = this;

	if(!name || !uid) {
		return cb(new Error('Provider name or uid is undefined'));
	}

	if(this.hasProvider(name, uid) !== false) {
		return cb(new Error('This provider is already associated to this user'));
	}

	var providerData = {
		name: name,
		uid: uid,
		nameUID: provider.genNameUID(name, uid),
		data: data
	};

	this.providers.push(providerData);
	return this.save(cb);
};

var removeProvider = exports.removeProvider = function(name, uid, cb) {
	var self = this;

	if(!name || !uid) {
		return cb(new Error('Provider name or uid is undefined'));
	}

	var removed = false;
	var nameUID = provider.genNameUID(name, uid);

	for(var i=0; i<this.providers.length; i++) {
		var providerData = this.providers[i];

		if(providerData.nameUID === nameUID) {
			this.providers.splice(i, 1);
			removed = true;
			break;
		}
	}

	if(!removed) {
		return cb(new Error('This provider is not associated to this user'));
	}

	return this.save(cb);
};

var getProvider = exports.getProvider = function(providerName, providerUID) {
	for(var i=0; i<this.providers.length; i++) {
		var provider = this.providers[i];

		if(provider.name === providerName) {
			if(providerUID && provider.uid !== providerUID) {
				continue;
			}

			return provider;
		}
	}

	return null;
};

var hasProvider = exports.hasProvider = function(providerName, providerUID) {
	return this.getProvider(providerName, providerUID) !== null;
};

var getProvidersNameUIDs = exports.getProvidersNameUIDs = function() {
	var providers = [];

	for(var i=0; i<this.providers.length; i++) {
		var provider = this.providers[i];
		providers.push(provider.nameUID);
	}

	return providers;
};

/**
 * Compare user entered password with stored user's password
 * @param  {String}   candidatePassword 
 * @param  {Function} cb                
 */
var comparePassword = exports.comparePassword = function(candidatePassword, cb) {
	bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
		if (err) {
			return cb(err);
		}
			
		cb(null, isMatch);
	});
};

var hasPassword = exports.hasPassword = function() {
	return this.password ? true : false;
};

var setPassword = exports.setPassword = function(password, cb) {
	this.password = password;
	return this.save(cb);
};

var hasEmail = exports.hasEmail = function() {
	return this.email ? true : false;
};

var setEmail = exports.setEmail = function(email, cb) {
	this.email = email;
	return this.save(cb);
};

var hasUsername = exports.hasUsername = function() {
	return this.username ? true : false;
};

var setUsername = exports.setUsername = function(username, cb) {
	this.username = username;
	return this.save(cb);
};

var incLoginAttempts = exports.incLoginAttempts = function(cb) {
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
};

/**
 * Create schema for model
 * @param  {mongoose.Schema} Schema
 * @return {mongoose.Schema} User Instance of user schema
 */
var createSchema = exports.createSchema = function (Schema) {
	var providerSchema = provider.createSchema(Schema);

	//add properties to schema
	var schema = new Schema({
		firstName     : { type: String },
		lastName      : { type: String },
		name          : { type: String },

		image         : { type: String },

		email         : { type: String, unique: true, sparse: true },
		username      : { type: String, unique: true, sparse: true },

		password      : { type: String },

		loginAttempts : { type: Number, required: true, default: 0 },
		lockUntil     : { type: Number },

		providers     : [providerSchema]
	});

	//add RBAC permissions
	schema.plugin(mongooseHRBAC, {});

	//add indexes
	schema.index({'providers.name': 1, 'providers.id': 1});
	schema.index({'providers.nameUID': 1}, { unique: true, sparse: true });

	schema.virtual('isLocked').get(function() {
    	// check for a future lockUntil timestamp
    	return !!(this.lockUntil && this.lockUntil > Date.now());
	});

	schema.pre('validate', function(next) {
		var user = this;

		//update name
		if ((user.isModified('firstName') || user.isModified('lastName')) && !user.isModified('name')) {
			if(user.firstName && user.lastName) {
				user.name = user.firstName + ' ' + user.lastName;
			} else {
				user.name = user.firstName || user.lastName || '';
			} 
		}

		next();
	});

	//add preprocess validation
	schema.pre('save', function(next) {
		var user = this;

		// only hash the password if it has been modified (or is new)
		if (!user.isModified('password')) {
			return next();
		}

		// hash the password using our new salt
		bcrypt.hash(user.password, SALT_WORK_FACTOR, function(err, hash) {
			if (err) {
				return next(err);
			}

			// override the cleartext password with the hashed one
			user.password = hash;
			next();
		});
	});

	//add permalink
	schema.plugin(permalink, {
		sources: ['name', 'firstName', 'lastName', 'username']
	});

	schema.methods.generateAccessToken = generateAccessToken;

	//auth
	schema.methods.isMe = isMe;

	//password
	schema.methods.hasPassword = hasPassword;
	schema.methods.setPassword = setPassword;
	schema.methods.comparePassword = comparePassword;
	schema.methods.incLoginAttempts = incLoginAttempts;

	//email
	schema.methods.hasEmail = hasEmail;
	schema.methods.setEmail = setEmail;

	//username
	schema.methods.hasUsername = hasUsername;
	schema.methods.setUsername = setUsername;	

	//create
	//schema.statics.create = create;
	schema.statics.createByFacebook = createByFacebook;

	//search
	schema.statics.findByID = findByID;
	schema.statics.findByUsername = findByUsername;
	schema.statics.findByUsernamePassword = findByUsernamePassword;
	schema.statics.findByPermalink = findByPermalink;
	
	schema.statics.findByProviderUID = findByProviderUID;
	schema.statics.findByFacebookID = findByFacebookID;


	//providers
	schema.methods.addProvider = addProvider;
	schema.methods.removeProvider = removeProvider;
	schema.methods.getProvider = getProvider;
	schema.methods.hasProvider = hasProvider;
	schema.methods.getProvidersNameUIDs = getProvidersNameUIDs;

	schema.methods.updateMultiple = updateMultiple;

	schema.methods.getPrivateJSON = getPrivateJSON;

	schema.methods.getDisplayName = getDisplayName;

	return schema;
};

exports.createModel = function(db) {
	return db.model(name, createSchema(db.mongoose.Schema));   
};


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