import * as mongoose from 'mongoose';

const demandPlanSchema = new mongoose.Schema({
  ownerId: mongoose.Schema.Types.ObjectId,
  date: Date,
  title: String,
  filter: String,
  rows: [Number],
  logins: [String]
});

const DemandPlan = mongoose.model('demandPlan', demandPlanSchema);

export default DemandPlan;
