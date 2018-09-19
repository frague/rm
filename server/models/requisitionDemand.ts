import * as mongoose from 'mongoose';

const requisitionDemandSchema = new mongoose.Schema({
  requisitionId: String,
  demandIds: [String],
  updated: Date
});

const RequisitionDemand = mongoose.model('RequisitionDemand', requisitionDemandSchema);

export default RequisitionDemand;
