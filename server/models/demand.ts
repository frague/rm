import * as mongoose from 'mongoose';

var idType = mongoose.Schema.Types.ObjectId;

const demandSchema = new mongoose.Schema({
  account: String,
  accountId: String,
  status: String,
  acknowledgement: String,
  role: String,
  profile: String,
  start: Date,
  end: Date,
  deployment: String,
  stage: String,
  grades: [String],
  locations: [String],
  requestId: String,
  comment: String
});

const Demand = mongoose.model('Demand', demandSchema);

export default Demand;