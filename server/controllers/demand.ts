import Demand from '../models/demand';
import BaseCtrl from './base';


export default class DemandCtrl extends BaseCtrl {
  model = Demand;

  extractCriteria = (source: any[], condition: string) => {
    let result = source.reduce((result, criterion) => {
      let key = Object.keys(criterion)[0];
      if (key.indexOf('demand.') === 0) {
        let newKey = key.replace('demand.', '');
        result.push({[newKey]: criterion[key]});
      }
      return result;
    }, []);
    return result.length ? {[condition]: result} : {};
  };

  getAll = (req, res) => {
    let queryOr = {};
    let queryAnd = {};

    let or = req.query.or;
    if (or) {
      or = JSON.parse(or);

      this.extractCriteria(or, '$or');

      let and = or.filter(criterion => !!criterion['$and']);
      if (and.length) {
        let queryAnd = this.extractCriteria(and[0]['$and'], '$and');
        if (queryAnd['$and']) {
          if (queryOr['$or']) {
            queryOr['$or'].push(queryAnd);
          } else {
            queryOr = queryAnd;
          }
        }
      }
    }
    let query = Object.keys(queryOr).length > 0 ? queryOr : {};

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
