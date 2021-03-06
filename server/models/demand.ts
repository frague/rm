import * as mongoose from 'mongoose';

var idType = mongoose.Schema.Types.ObjectId;

const demandSchema = new mongoose.Schema({
  name: String,
  account: String,
  accountId: String,
  project: String,
  pool: String,
  role: String,
  profile: String,
  specializations: String,
  start: Date,
  end: Date,
  deployment: String,
  stage: String,
  isBooked: Boolean,
  grades: String,
  locations: String,
  requestId: [String],
  requirements: String,
  comment: String,
  candidates: [String],
  candidatesStati: [String],
  login: String,
  duration: Number,
});

const Demand = mongoose.model('Demand', demandSchema);

export default Demand;
