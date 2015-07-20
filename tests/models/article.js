import { Schema } from 'mongoose';
export const name = 'Article';

export default function createModel(server, callback) {
  const schema = new Schema({
    title: { type: String }
  });

  callback(null);
  return server.db.model(name, schema);
}
