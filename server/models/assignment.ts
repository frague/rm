import * as mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  resourceId: String,
  initiativeId: String,
  start: Date,
  end: Date,
  isBillable: Boolean,
  involvement: Number
});

const Assignment = mongoose.model('Assignment', assignmentSchema);

export default Assignment;
