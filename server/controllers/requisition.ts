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
            from: 'demands',
            localField: 'requisitionId',
            foreignField: 'requestId',
            as: 'demandLocations'
          }
        },
        {
          '$unwind': {
            path: '$demandLocations',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          '$addFields': {
            'demandLogin': '$demandLocations.login',
            'demandLocations': '$demandLocations.locations'
          }
        },
        {
          '$match': query
        },
        {
          '$group': {
            _id: '$_id',
            category: { '$first': '$category' },
            demandLogin: { '$first': '$demandLogin' },
            demandLocations: { '$first': '$demandLocations' },
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

      // .find(query)
      // .sort({requisitionId: 1})
      // .exec((err, docs) => {
      //   if (err) { return console.error(err); }
      //   res.json(docs);
      // });
  }
}
