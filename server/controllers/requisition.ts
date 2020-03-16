import Requisition from '../models/requisition';
import Candidate from '../models/candidate';
import BaseCtrl from './base';

import { printTitle } from '../utils';

export default class RequisitionCtrl extends BaseCtrl {
  model = Requisition;
  limit = 1000;

  commentsModifiers = {
    include: ['comments'],
    comments: (key, value) => this.commentTransform(key, value, 'candidate')
  };

  candidateCommentsModifiers = {
    include: ['comments'],
    comments: (key, value) => this.commentTransform(key, value)
  };

  requisitionsModifiers = {
    include: ['requisition'],
    requisition: (key, value) => {
      if (key === 'requisitions') {  // Exclude requsitions=true/false from becoming a condition
        return false;
      }
      key = key.replace('requisition.', '');
      return {[key]: value};
    },
  };

  candidatesModifiers = {
    include: ['candidate'],
    candidate: (key, value) => {
      if (key === 'candidates') {  // Exclude candidates=true/false from becoming a condition
        return false;
      }
      // key = key.replace('candidate.', '');
      return {[key]: value};
    },
  };

  candidatesAltModifiers = {
    include: ['candidate'],
    candidate: (key, value) => {
      if (key === 'candidates' || key.includes('.comments')) {  // Exclude candidates=true/false from becoming a condition
        return false;
      }
      key = key.replace('candidate.', '');
      return {[key]: value};
    },
  };

  // Get by id
  get = (req, res) => {
    this.model.findOne({ requisitionId: req.params.id }, (err, obj) => {
      if (err) {
        return this._respondWithError(res, err);
      }
      res.json(obj);
    });
  }

  // Get all
  getAll = (req, res) => {
    printTitle('Requisitions & Candidates');

    let or, order;
    try {
      or = req.query.or ? JSON.parse(req.query.or) : [];
    } catch (e) {
      console.error('Error parsing search query: ' + req.query.or);
      return res.sendStatus(500);
    }

    let requisitionsQuery = this.fixOr(this.modifyCriteria(or, this.requisitionsModifiers));
    let commentsQuery = this.fixOr(this.modifyCriteria(or, this.commentsModifiers));
    let candidateCommentsQuery = this.fixOr(this.modifyCriteria(or, this.candidateCommentsModifiers));
    let candidatesQuery = this.fixOr(this.modifyCriteria(or, this.candidatesModifiers));
    let candidatesAltQuery = this.fixOr(this.modifyCriteria(or, this.candidatesAltModifiers));

    this.limit = (Object.keys(commentsQuery).length || Object.keys(requisitionsQuery).length) ? 1000 : 100;
    order = this.determineOrder(req);

    console.log('Initial:', JSON.stringify(or));
    console.log('Requisitions query:', JSON.stringify(requisitionsQuery));
    console.log('Candidates query:', JSON.stringify(candidatesQuery));
    console.log('Candidates alt query:', JSON.stringify(candidatesAltQuery));
    console.log('Comments query:', JSON.stringify(commentsQuery));
    console.log('Candidates comments query:', JSON.stringify(candidateCommentsQuery));
    console.log('Order:', JSON.stringify(order));

    if (Object.keys(requisitionsQuery).length) {
      console.log('Primary filtering: requisition');
      // Filter by requisition properties first
      return Requisition
        .aggregate()
        .match(requisitionsQuery)

        // Lookup requisitions comments
        .lookup({
          from: 'comments',
          localField: 'requisitionId',
          foreignField: 'login',
          as: 'comments'
        })
        .addFields({
          'commentsCount': {'$size': '$comments'},
          'status': {
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
        })
        .match(commentsQuery)

        // Lookup candidates
        .lookup({
          from: 'candidates',
          localField: 'requisitionId',
          foreignField: 'requisitionId',
          as: 'candidate'
        })
        .unwind({
          path: '$candidate',
          preserveNullAndEmptyArrays: true
        })
        .match(candidatesQuery)

        // Lookup candidates comments
        .lookup({
          from: 'comments',
          let: {
            login: '$candidate.login'
          },
          pipeline: [{
            '$match': {
              '$expr': {
                '$eq': ['$login', '$$login']
              }
            }
          }],
          as: 'candidate.comments'
        })
        .addFields({
          'candidate.commentsCount': {'$size': '$candidate.comments'},
          'candidate.status': {
            '$arrayElemAt': [
              {
                '$filter': {
                  input: '$candidate.comments',
                  as: 'status',
                  cond: {
                    '$eq': ['$$status.isStatus', true]
                  }
                }
              },
              0
            ]
          }
        })
        .match(commentsQuery)

        // Group by requisition
        .group({
          _id: '$_id',
          category: {'$first': '$category'},
          department: {'$first': '$department'},
          detailLink: {'$first': '$detailLink'},
          internalOnly: {'$first': '$internalOnly'},
          jobState: {'$first': '$jobState'},
          jobType: {'$first': '$jobType'},
          location: {'$first': '$location'},
          postingType: {'$first': '$postingType'},
          requisitionId: {'$first': '$requisitionId'},
          eId: {'$first': '$eId'},
          title: {'$first': '$title'},
          candidates: {'$push': '$candidate'},
          status: {'$first': '$status'},
          commentsCount: {'$first': '$commentsCount'},
        })

        .sort(order)

        // Lookup requisitions demands
        .lookup({
          from: 'requisitiondemands',
          localField: 'requisitionId',
          foreignField: 'requisitionId',
          as: 'rd'
        })
        .addFields({
          demandLogin: {
            '$arrayElemAt': ['$rd.demandIds', 0]
          }
        })
        .unwind({
          path: '$demandLogin',
          preserveNullAndEmptyArrays: true
        })
        .lookup({
          from: 'demands',
          localField: 'demandLogin',
          foreignField: 'login',
          as: 'demand'
        })
        .addFields({
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
        })
        .group({
          _id: '$_id',
          category: { '$first': '$category' },
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
          candidates: {'$first': '$candidates'},
          status: {'$first': '$status'},
          commentsCount: {'$first': '$commentsCount'},
        })
        .addFields({
          demands: {
            '$setDifference': ['$demands', [null]]
          },
          candidates: {
            '$setDifference': ['$candidates', [{comments: [], commentsCount: 0}]]
          },
          index: {
            '$convert': {
              input: {
                '$ltrim': {
                  input: '$requisitionId',
                  chars: 'GDHR-'
                }
              },
              to: 'int'
            }
          }
        })
        .sort(order)
        .limit(this.limit)
        .exec()
        .then(data => {
          console.log(`Records matched: ${data && data.length}`);
          return res.json(data)
        })
        .catch(error => {
          console.log('Error', error);
          res.sendStatus(500);
        });
    } else {
      console.log('Primary filtering: candidate');

      // Filter by candidates properties first
      Candidate
        .aggregate()
        .match(candidatesAltQuery)

        .lookup({
          from: 'comments',
          let: {
            login: '$login'
          },
          pipeline: [{
            '$match': {
              '$expr': {
                '$eq': ['$login', '$$login']
              }
            }
          }],
          as: 'comments'
        })
        .addFields({
          'commentsCount': {'$size': '$comments'},
          'status': {
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
        })
        .match(candidateCommentsQuery)

        .lookup({
          from: 'requisitions',
          localField: 'requisitionId',
          foreignField: 'requisitionId',
          as: 'requisition'
        })
        .addFields({
          candidateId: '$_id'
        })
        .project({
          _id: '$requisition._id',
          category: '$requisition.category',
          department: '$requisition.department',
          detailLink: '$requisition.detailLink',
          internalOnly: '$requisition.internalOnly',
          jobState: '$requisition.jobState',
          jobType: '$requisition.jobType',
          location: '$requisition.location',
          postingType: '$requisition.postingType',
          requisitionId: '$requisition.requisitionId',
          eId: '$requisition.eId',
          title: '$requisition.title',
          candidate: {
            login: '$login',
            name: '$name',
            country: '$country',
            city: '$city',
            location: '$location',
            profile: '$profile',
            state: '$state',
            updated: '$updated',
            requisitionId: '$requisitionId',
            applicationId: '$applicationId',
            comments: '$comments',
            commentsCount: '$commentsCount',
            status: '$status',
          }
        })
        .group({
          _id: '$_id',
          category: {'$first': '$category'},
          department: {'$first': '$department'},
          detailLink: {'$first': '$detailLink'},
          internalOnly: {'$first': '$internalOnly'},
          jobState: {'$first': '$jobState'},
          jobType: {'$first': '$jobType'},
          location: {'$first': '$location'},
          postingType: {'$first': '$postingType'},
          requisitionId: {'$first': '$requisitionId'},
          eId: {'$first': '$eId'},
          title: {'$first': '$title'},
          candidates: {'$push': '$candidate'},
        })
        .match(requisitionsQuery)

        .lookup({
          from: 'comments',
          localField: 'requisitionId',
          foreignField: 'login',
          as: 'comments'
        })
        .addFields({
          'commentsCount': {'$size': '$comments'},
          'status': {
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
        })
        .sort(order)

        .lookup({
          from: 'requisitiondemands',
          localField: 'requisitionId',
          foreignField: 'requisitionId',
          as: 'rd'
        })
        .addFields({
          demandLogin: {
            '$arrayElemAt': ['$rd.demandIds', 0]
          }
        })
        .unwind({
          path: '$demandLogin',
          preserveNullAndEmptyArrays: true
        })
        .lookup({
          from: 'demands',
          localField: 'demandLogin',
          foreignField: 'login',
          as: 'demand'
        })
        .addFields({
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
        })
        .addFields({
          demands: {
            '$setDifference': ['$demands', [null]]
          },
          candidates: {
            '$setDifference': ['$candidates', [{comments: [], commentsCount: 0}]]
          },
        })
        .sort(order)
        .limit(this.limit)
        .exec()
        .then(data => {
          console.log(`Records matched: ${data && data.length}`);
          return res.json(data)
        })
        .catch(error => {
          console.log('Error', error);
          res.sendStatus(500);
        });
    }

  }
}
