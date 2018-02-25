import * as mongoose from 'mongoose';

const requisitionSchema = new mongoose.Schema({
  category: String,
  department: String,
  detailLink: String,
  internalOnly: Boolean,
  jobLocations: Object,
  jobState: String,
  jobType: String,
  location: String,
  postingType: String,
  requisitionId: String,
  eId: String,
  title: String
});

const Requisition = mongoose.model('Requisition', requisitionSchema);

export default Requisition;
