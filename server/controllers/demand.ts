import Demand from '../models/demand';
import BaseCtrl from './base';

const whiteList = ['pool', 'assignment.account'];

export default class DemandCtrl extends BaseCtrl {
  model = Demand;

  getAll = (req, res) => {
    let query = {};
    try {
      query = Object.keys(req.query)
        .filter(key => whiteList.indexOf(key) >= 0)
        .reduce((result, key) => {
          let value = JSON.parse(req.query[key]);
          if (key.indexOf('assignment') >= 0) {
            key = key.replace('assignment.', '');
          }
          result[key] = value;
          return result;
        }, {});
    } catch (e) {}

    delete query['demand'];

    console.log(req.query);
    this.model.find(query, (err, docs) => {
      if (err) { return console.error(err); }
      res.json(docs);
    });
  }

  cleanup = (req, res) => {
    Demand.deleteMany({}, (err) => {
      if (err) { return console.error(err); }
      res.sendStatus(200);
    })
  };
}
