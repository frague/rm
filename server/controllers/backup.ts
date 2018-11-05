import * as mongoose from 'mongoose';

import Filter from '../models/filter';
import Plan from '../models/demandplan';
import Resource from '../models/resource';
import Demand from '../models/demand';
import Requisition from '../models/requisition';
import Candidate from '../models/candidate';

import Comment from '../models/comment';

const entities = [Resource, Demand, Requisition, Candidate];
const idsFields = ['login', 'login', 'requisitionId', 'login'];

const models = {
  comments: Comment,
  filters: Filter,
  plans: Plan
};

export default class BackupCtrl {

  download = (req, res) => {
    Promise.all([Comment, Filter, Plan].map(model => model.find({})))
      .then(([comments, filters, plans]) => {
        console.log('- Backup -----------------------------------------------------');
        console.log(`${comments.length} comments`);
        console.log(`${filters.length} filters`);
        console.log(`${plans.length} demand plans`);

        res.attachment('rm_comments_' + (new Date()).toISOString().substr(0, 10) + '.json');
        res.setHeader('Content-type', 'application/json');
        res.json({comments, filters, plans})
      })
      .catch(error => {
        console.log('Backup creation error:', error);
        res.sendStatus(500);
      });
  }

  restore = (req, res) => {
    if (req.body && req.body.backup && req.body.backup.value) {
      console.log('- Backup restore -----------------------------------------------');
      let data: any;
      try {
        data = JSON.parse(new Buffer(req.body.backup.value, 'base64').toString());
      } catch (error) {
        console.log('Backup restoring error:', error);
        return res.sendStatus(500);
      }

      let result = [];
      Promise.all(
        Object.keys(models).map(key => {
          let model = models[key];

          return model.deleteMany({}, (err) => {
            let items = data[key];
            items.forEach(itemData => {
              delete itemData['__v'];
              new model(itemData).save();
            });
            let r = items.length + ' ' + key + ' were successfully restored from backup';
            result.push(r);
            console.log(r);
          });
        })
      )
        .then(() => {
          return res.json(result);
        })
        .catch(error => {
          console.log('Error restoring from backup:', error);
          return res.sendStatus(500);
        });
    } else {
      return res.sendStatus(500);
    }
  }

  private _queryModel = (model: mongoose.Schema, idName: string): Promise<any[]> => {
    return model.aggregate([
      {
        '$group': {
          _id: null,
          ids: {'$push': '$' + idName}
        }
      }
    ])
      .cursor({})
      .exec()
      .toArray()
      .then(data => data[0].ids);
  }

  cleanup = async (req, res) => {
    Promise.all(entities.map((model, index) => 
      this._queryModel(model, idsFields[index])
    ))
      .then(results => {
        let ids = [].concat(...results);
        Comment
          .deleteMany({login: {'$nin': ids}})
          .exec()
          .then(data => {
            res.json({deleted: data.deletedCount});
          });
      })
      .catch(error => res.sendStatus(500));
  }

}