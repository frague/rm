import * as mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  color: String,
  description: String,
});

const Badge = mongoose.model('Badge', badgeSchema);

export default Badge;