import * as mongoose from 'mongoose';

const requisitionSchema = new mongoose.Schema({
  position: String,
  title: String,
  jobType: String,
  category: String,
  source: String,
  department: String,
  account: String,
  project: String,
  profile: String,
  specialization: String,
  grade1: String,
  grade2: String,
  city: String,
  location: String,
  billability: String,
  start: Date,
  end: Date
});

const Requisition = mongoose.model('Requisition', requisitionSchema);

export default Requisition;
