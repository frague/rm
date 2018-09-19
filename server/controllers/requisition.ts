import Requisition from '../models/requisition';
import Candidate from '../models/candidate';
import BaseCtrl from './base';

export default class RequisitionCtrl extends BaseCtrl {
  model = Requisition;

  // Get all
  getAll = (req, res) => {
    let query = this.reduceQuery(req.query);
    console.log('Finding all', query);
    Requisition
      .aggregate([
        {
          '$lookup': {
            from: 'requisitiondemands',
            localField: 'requisitionId',
            foreignField: 'requisitionId',
            as: 'rd'
          }
        },
        {
          '$addFields': {
            demandLogin: {
              '$arrayElemAt': ['$rd.demandIds', 0]
            }
          }
        },
        {
          '$unwind': {
            path: '$demandLogin',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          '$lookup': {
            from: 'demands',
            localField: 'demandLogin',
            foreignField: 'login',
            as: 'demand'
          }
        },
        {
          '$addFields': {
            'd': {
              '$cond': {
                if: '$demandLogin',
                then: {
                  id: '$demandLogin',
                  login: {
                    '$arrayElemAt': ['$demand.login', 0]
                  },
                  locations: '$demand.locations',
                },
                else: null
              }
            }
          }
        },
        {
          '$match': query
        },
        {
          '$group': {
            _id: '$_id',
            category: { '$first': '$category' },
            demandLogins: { '$push': '$demandLogin' },
            demands: { '$push': '$d' },
            department: { '$first': '$department' },
            detailLink: { '$first': '$detailLink' },
            eId: { '$first': '$eId' },
            internalOnly: { '$first': '$internalOnly' },
            jobState: { '$first': '$jobState' },
            jobType: { '$first': '$jobType' },
            location: { '$first': '$location' },
            postingType: { '$first': '$postingType' },
            requisitionId: { '$first': '$requisitionId' },
            title: { '$first': '$title' },
          }
        },
        {
          '$addFields': {
            demands: {
              '$setDifference': ['$demands', [null]]
              // '$concatArrays': [
              //   {'$setDifference': ['$demands', [null]]},
              //   [{
              //     id: '1111_AA',
              //     login: null,
              //     locations: ['SAR'],
              //   }]
              // ]
            }
          }
        },
        {
          '$sort': {'requisitionId': 1}
        }
      ])
      .cursor({})
      .exec()
      .toArray()
      .then(data => res.json(data))
      .catch(error => {
        console.log('Error', error);
        return res.sendStatus(500);
      });
  }
}
