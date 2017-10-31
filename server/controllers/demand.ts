import Demand from '../models/demand';
import BaseCtrl from './base';

export default class DemandCtrl extends BaseCtrl {
  model = Demand;

  cleanup = (req, res) => {
    Demand.deleteMany({}, (err) => {
      if (err) { return console.error(err); }
      res.sendStatus(200);
    })
  };
}
