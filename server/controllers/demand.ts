import Demand from '../models/demand';
import BaseCtrl from './base';


export default class DemandCtrl extends BaseCtrl {
  model = Demand;

  getAll = (req, res) => {
    let query = {};
    try {
      query = Object.keys(req.query)
        .filter(key => !key.indexOf('demand.'))
        .reduce((result, key) => {
          let value = JSON.parse(req.query[key]);
          result[key.replace('demand.', '')] = value;
          return result;
        }, {});
    } catch (e) {}

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
