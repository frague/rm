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

  demandTransform = (key, value) => {
    key = key.replace('demand.', '');
    return {[key]: value};
  }

  getAll = (req, res) => {
    let or;
    let query = {};
    let commentsQuery = {};

    try {
      or = req.query.or ? JSON.parse(req.query.or) : [];
    } catch (e) {
      console.error('Error parsing search query: ' + req.query.or);
      return res.status(500);
    }

    query = this.filterCriteria( or, new RegExp(/^demand\./), this.orKey, this.demandTransform) || {};
    commentsQuery = this.filterCriteria(or, new RegExp(/^comments/), this.orKey, this.commentTransform) || {};

    console.log('------------------------------------------------------');
    console.log('Initial:', JSON.stringify(or));
    console.log('Query:', JSON.stringify(query));
    console.log('Comments:', JSON.stringify(commentsQuery));

    Demand.aggregate([
      {
        '$lookup': {
          from: 'comments',
          localField: 'login',
          foreignField: 'login',
          as: 'comments'
        }
      },
      {
        '$addFields': {
          commentsCount: {'$size': '$comments'},
          status: {
            '$arrayElemAt': [
              {
                '$filter': {
                  input: '$comments',
                  as: 'status',
                  cond: {
                    '$eq': ['$$status.isStatus', true]
                  }
                }
              },
              0
            ]
          }
        }
      },
      {
        '$match': commentsQuery
      },
      {
        '$project': {
          account: 1,
          pool: 1,
          acknowledgement: 1,
          role: 1,
          profile: 1,
          start: 1,
          end: 1,
          deployment: 1,
          stage: 1,
          grades: 1,
          locations: 1,
          requestId: 1,
          comment: 1,
          login: 1,
          commentsCount: 1,
          status: 1
        }
      },
      {
        '$match': query
      },
      {
        '$sort': {
          login: 1
        }
      }
    ], (err, docs) => {
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
