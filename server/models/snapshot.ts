import * as mongoose from 'mongoose';

const snapshotSchema = new mongoose.Schema({
  date: Date,
  snapshot: Object
});

const Snapshot = mongoose.model('Snapshot', snapshotSchema);

export default Snapshot;
