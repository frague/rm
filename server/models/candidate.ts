import * as mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema({
  login: String,
  name: String,
  requisitionId: String
});

const Candidate = mongoose.model('Candidate', candidateSchema);

export default Candidate;
