'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.genNameUID = genNameUID;
exports.createSchema = createSchema;
var name = 'Provider';

exports.name = name;
/**
 * Generate provider uid name from provider name and user ID
 * @param  {String} providerName Provider name
 * @param  {String} uid          User ID
 * @return {String}              Provider UID
 */

function genNameUID(providerName, uid) {
  return providerName + '_' + uid;
}

function createSchema(Schema) {
  // add properties to schema
  var schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    uid: { type: String, required: true },
    nameUID: { type: String, required: true },
    data: { type: String }
  });

  // add indexes
  schema.index({ user: 1, name: 1 });
  schema.index({ nameUID: 1 }, { unique: true });

  // add preprocess validation
  schema.pre('save', function saveCallback(next) {
    // only hash the password if it has been modified (or is new)
    if (this.isModified('name') || this.isModified('uid') || !this.nameUID) {
      this.nameUID = genNameUID(this.name, this.uid);
    }

    next();
  });

  return schema;
}