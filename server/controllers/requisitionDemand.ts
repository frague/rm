import RequisitionDemand from '../models/requisitionDemand';
import BaseCtrl from './base';

export default class RequisitionDemandCtrl extends BaseCtrl {
  model = RequisitionDemand;

  cleanup = (req, res) => {
    this.model.deleteMany({}, (err) => {
      if (err) { return console.error(err); }
      res.json({});
    })
  };
}
