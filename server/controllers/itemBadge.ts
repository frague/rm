import ItemBadge from '../models/itemBadge';
import BaseCtrl from './base';

export default class ItemBadgeCtrl extends BaseCtrl {
  model = ItemBadge;

  cleanup = (req, res) => {
    this.model.deleteMany({}, (err) => {
      if (err) { return console.error(err); }
      res.sendStatus(200);
    })
  };
}
