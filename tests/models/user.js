import { Schema } from 'mongoose';
import * as user from '../../src/models/user';
export const name = 'User';

export default function createModel(server, callback) {
  const schema = user.createSchema(Schema);

  callback(null);
  return server.db.model(name, schema);
}
