import Filter from '../models/filter';
import BaseCtrl from './base';
import { printTitle } from '../utils';

export default class ResourceCtrl extends BaseCtrl {
  model = Filter;

// Get all
  getAll = (req, res) => {
    printTitle('Filters');

    let query = this.reduceQuery(req.query);
    console.log('Finding all', query);
    this.model.find(query).sort({title: 1}).limit(100).exec((err, data) => {
      if (err) {
        return this._respondWithError(res, err);
      }
      console.log(`Records matched: ${data && data.length}`);
      res.json(data);
    });
  }
}
