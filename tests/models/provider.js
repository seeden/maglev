import { Schema } from 'mongoose';
import * as provider from '../../src/models/provider';
export const name = 'Provider';

export default function createModel(server, callback) {
  const schema = provider.createSchema(Schema);

  callback(null);
  return server.db.model(name, schema);
}
