import * as mongoose from 'mongoose';

const filterSchema = new mongoose.Schema({
  ownerId: mongoose.Schema.Types.ObjectId,
  title: String,
  filter: String
});

const Filter = mongoose.model('Filter', filterSchema);

export default Filter;
