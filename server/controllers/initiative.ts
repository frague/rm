import Initiative from '../models/initiative';
import Assignment from '../models/assignment';
import BaseCtrl from './base';

export default class InitiativeCtrl extends BaseCtrl {
  model = Initiative;

  cleanup = (req, res) => {
    Assignment.deleteMany({initiativeId: req.params.id}, (err) => {
      if (err) { return console.error(err); }
      res.json({});
    })
  };
}
