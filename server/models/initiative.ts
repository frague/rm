import * as mongoose from 'mongoose';

const initiativeSchema = new mongoose.Schema({
  name: String,
  account: String,
  start: Date,
  end: Date,
  color: String
});

const Initiative = mongoose.model('Initiative', initiativeSchema);

export default Initiative;
