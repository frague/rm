import * as mongoose from 'mongoose';

const initiativeSchema = new mongoose.Schema({
  _id: String,
  name: String,
  account: String,
  start: Date,
  end: Date,
  color: String
}, {
  _id: false
});

const Initiative = mongoose.model('Initiative', initiativeSchema);

export default Initiative;
