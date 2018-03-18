import * as mongoose from 'mongoose';

const diffSchema = new mongoose.Schema({
  date: Date,
  subject: String,
  title: String,
  diff: Object,
  type: String
});

const Diff = mongoose.model('Diff', diffSchema);

export default Diff;
