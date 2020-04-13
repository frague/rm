import ItemBadge from '../models/itemBadge';
import BaseCtrl from './base';

export default class ItemBadgeCtrl extends BaseCtrl {
  model = ItemBadge;

  delete = (req, res) => {
    this.model.findOneAndRemove({ itemId: req.params.itemId, badgeId: req.params.badgeId }, (err) => {
      if (err) {
        return this._respondWithError(res, err);
      }
      res.json({});
    });
  }
}
