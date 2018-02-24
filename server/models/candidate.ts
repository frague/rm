import * as mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema({
  login: String,
  name: String,
  country: String,
  city: String,
  location: String,
  profile: String,
  state: String,
  updated: Date,
  requisitionId: String,
  applicationId: String
});

const Candidate = mongoose.model('Candidate', candidateSchema);

export default Candidate;
