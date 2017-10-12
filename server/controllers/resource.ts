import Resource from '../models/resource';
import Assignment from '../models/assignment';
import BaseCtrl from './base';

export default class ResourceCtrl extends BaseCtrl {
  model = Resource;

  cleanup = (req, res) => {
    Assignment.deleteMany({resourceId: req.params.id}, (err) => {
      if (err) { return console.error(err); }
      res.sendStatus(200);
    })
  };
}
