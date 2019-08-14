import * as mongoose from 'mongoose';

const itemBadgeSchema = new mongoose.Schema({
  itemId: String,
  badgeId: String,
});

itemBadgeSchema.index({itemId: 1, badgeId: 1}, {unique: true});

const ItemBadge = mongoose.model('ItemBadge', itemBadgeSchema);

export default ItemBadge;
