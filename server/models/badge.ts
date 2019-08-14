import * as mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema({
  title: String,
  color: String,
  description: String,
});

const Badge = mongoose.model('Badge', badgeSchema);

export default Badge;