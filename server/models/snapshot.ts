import * as mongoose from 'mongoose';

const snapshotSchema = new mongoose.Schema({
  date: Date,
  snapshot: Object,
  type: String
});

const Snapshot = mongoose.model('Snapshot', snapshotSchema);

export default Snapshot;
