import * as mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  name: String,
  login: String,
  grade: String,
  location: String,
  profile: String,
  specialization: String,
  pool: String,
  manager: String,
  skype: String,
  phone: String,
  room: String,
  passport: Date,
  visaB: Date,
  visaL: Date,
  license: Boolean
});

const Resource = mongoose.model('Resource', resourceSchema);

export default Resource;
