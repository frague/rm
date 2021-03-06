import Badge from '../models/badge';
import ItemBadge from '../models/itemBadge';
import { printTitle } from '../utils';
import BaseCtrl from './base';

export default class BadgeCtrl extends BaseCtrl {
  model = Badge;

  cleanup = (req, res) => {
    ItemBadge.deleteMany({badgeId: req.params.id}, (err) => {
      if (err) { return console.error(err); }
      res.json({});
    })
  }

  getAll = (req, res) => {
    printTitle('Badge');

    let query = this.reduceQuery(req.query);
    console.log('Query: ', query);

    this.model.find(query).sort({title: 1}).limit(100).exec((err, docs) => {
      if (err) {
        console.error(err);
        return res.sendStatus(500);
      }
      res.json(docs);
    });
  }

  getAllFor = (req, res) => {
    let itemId = req.params.id;
    let cursor = ItemBadge.aggregate([
      {
        '$match': { itemId }
      },
      {
        '$lookup': {
          from: 'badges',
          let: {
            'badgeId': '$badgeId'
          },
          pipeline: [
            {
              '$match': {
                '$expr': {
                  '$eq': ['$_id', {
                    '$toObjectId': '$$badgeId'
                  }]
                }
              }
            }
          ],
          as: 'badge'
        }
      },
      {
        '$unwind': {
          'path': '$badge'
        }
      },
      {
        '$project': {
          _id: '$badge._id',
          title: '$badge.title',
          color: '$badge.color',
          short: '$badge.short',
          description: '$badge.description',
        }
      }
    ])
      .then(data => {
        console.log(`Records matched: ${data && data.length}`);
        res.json(data);
      })
      .catch(error => {
        console.log('Error', error);
        return res.sendStatus(500);
      });
  }

}
