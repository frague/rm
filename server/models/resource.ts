import * as mongoose from 'mongoose';

export type locationType = 'SAR' | 'SPB' | 'MP' | 'KHR' | 'LV';

const resourceSchema = new mongoose.Schema({
  name: String,
  login: String,
  grade: String,
  location: ['SAR', 'SPB', 'MP', 'KHR', 'KR'],
  pool: ['ML', 'UI']
});

const Resource = mongoose.model('Resource', resourceSchema);

export default Resource;
