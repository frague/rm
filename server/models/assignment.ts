import * as mongoose from 'mongoose';

var idType = mongoose.Schema.Types.ObjectId;

const assignmentSchema = new mongoose.Schema({
  resourceId: idType,
  initiativeId: idType,
  start: Date,
  end: Date,
  billability: String,
  involvement: Number,
  comment: String
});

const Assignment = mongoose.model('Assignment', assignmentSchema);

export default Assignment;
