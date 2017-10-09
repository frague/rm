import * as mongoose from 'mongoose';

const initiativeSchema = new mongoose.Schema({
  name: String,
  start: Date,
  end: Date
});

const Initiative = mongoose.model('Initiative', initiativeSchema);

export default Initiative;
