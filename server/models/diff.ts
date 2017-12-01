import * as mongoose from 'mongoose';

const diffSchema = new mongoose.Schema({
  date: Date,
  subject: Object,
  diff: Object
});

const Diff = mongoose.model('Diff', diffSchema);

export default Diff;
