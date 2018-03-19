import Snapshot from '../models/snapshot';
import Resource from '../models/resource';
import Demand from '../models/demand';
import Candidate from '../models/candidate';
import Diff from '../models/diff';
import DiffCtrl from '../controllers/diff';
import BaseCtrl from './base';

var diffCtrl = new DiffCtrl();
const keys = [
  'account',
  'comment',
  'deployment',
  'end',
  'grade',
  'grades',
  'license',
  'location',
  'locations',
  'login',
  'manager',
  'name',
  'passport',
  'phone',
  'pool',
  'profile',
  'room',
  'skype',
  'specialization',
  'start',
  'requestId',
  'role',
  'stage',
  'state',
  'updated',
  'visaB',
  'visaL',
];

const dateKeys = [
  'end',
  'passport',
  'start',
  'updated',
  'visaB',
  'visaL',
];

export default class SnapshotCtrl extends BaseCtrl {
  model = Snapshot;

  _areEqual(a, b): any {
    return keys.reduce((result, key) => {
      let [c, d] = [a[key], b[key]];
      if (dateKeys.includes(key)) {
        [c, d] = [
          c ? c.toISOString().substr(0, 10) : '',
          d ? d.toISOString().substr(0, 10) : ''
        ];
      }
      if (c !== d) {
        result[key] = [c, d];
      }
      return result;
    }, {});
  }

  _saveDiffDelayed(diff: any) {
    new Diff(diff).save();
  }

  makeDiff = (current, type: string) => {
    this.model.find({type}).sort({date: 1}).limit(1).exec((err, docs) => {
      if (docs.length) {
        let prev = docs[0].snapshot || {};
        let today = new Date();

        var keys = Object.keys(Object.assign({}, current, prev));

        keys.forEach(login => {
          let state = prev[login] || {};
          let updated = current[login] || {};
          let diff: any = {
            date: today,
            subject: login,
            title: updated['name'] || state['name'] || login,
            type
          };

          if (!state['_id']) {
            diff.diff = 1;
            this._saveDiffDelayed(diff);
          } else if (!updated['_id']) {
            diff.diff = -1;
            this._saveDiffDelayed(diff);
          } else {
            let fields = this._areEqual(state, updated);
            if (Object.keys(fields).length) {
              diff.diff = fields;
              this._saveDiffDelayed(diff);
            }
          }
        });
      }

      // Delete the snapshot and save the new one
      this.model.deleteMany({type}, (err) => {
        new this.model({
          date: new Date(),
          snapshot: current,
          type
        }).save();
      })
    });
  }

  saveDiff(model, entity: string): Promise<any> {
    return new Promise((resolve, reject) => {
      model.find({}, (err, docs) => {
        if (err) reject(err);
        let updated = docs.reduce((result, doc) => {
          result[doc.login] = doc;
          return result;
        }, {});
        resolve(this.makeDiff(updated, entity));
      });
    });
  }

  saveDiffs = (req, res) => {
    Promise.all([
      this.saveDiff(Resource, 'r'),
      this.saveDiff(Demand, 'd'),
      this.saveDiff(Candidate, 'c')
    ])
      .then(() => {
        res.sendStatus(200);
      })
      .catch(err => {
        console.log(err);
        res.sendStatus(500);
      });
  }
}
