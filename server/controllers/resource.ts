import Resource from '../models/resource';
import Assignment from '../models/assignment';
import BaseCtrl from './base';
import { printTitle } from '../utils';

export default class ResourceCtrl extends BaseCtrl {
  model = Resource;

  modifiers = {
  };

  cleanup = (req, res) => {
    Assignment.deleteMany({resourceId: req.params.id}, (err) => {
      if (err) { return console.error(err); }
      res.json({});
    })
  }

	getAll = (req, res) => {
    printTitle('Resources');

    let or;
    try {
      or = req.query.or ? JSON.parse(req.query.or) : [];
    } catch (e) {
      console.error('Error parsing search query: ' + req.query.or);
      return res.sendStatus(500);
    }

    let query = this.fixOr(this.modifyCriteria(or, this.modifiers));

    console.log('Initial:', JSON.stringify(or));
    console.log('Query:', JSON.stringify(query));

    Resource
      .aggregate()
      .lookup({
        from: 'comments',
        localField: 'login',
        foreignField: 'login',
        as: 'comments'
      })
      .addFields({
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
      })
      .project({
        name: 1,
        login: 1,
        grade: 1,
        location: 1,
        profile: 1,
        specialization: 1,
        pool: 1,
        manager: 1,
        skype: 1,
        phone: 1,
        room: 1,
        passport: 1,
        license: 1,
        status: 1,
        commentsCount: 1,
        nextPr: 1,
        payRate: 1,
        onTrip: 1,
        birthday: 1,
        bambooId: 1,
        pmoId: 1,
        visas: 1,
        english: 1,
        CV: 1,
      })
      .match(query)
      .sort({
        name: 1
      })
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
