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
  'specializations',
  'candidates',
  'start',
  'requestId',
  'requirements',
  'role',
  'stage',
  'state',
  'updated',
  'visas',
  'nextPr',
  'payRate',
  'onTrip',
  'birthday',
  'english',
];

const dateKeys = [
  'end',
  'passport',
  'start',
  'updated',
  'visaB',
  'visaL',
  'nextPr',
  'birthday',
];

const deeps = {
  visas: (value: any) => {
    return (value || []).sort((a, b) => a.type > b.type).map(visa => `${visa.type} - ${redate(visa.till)}`).join(', ')
  }
};

const deepsKeys = Object.keys(deeps);

const redate = (c: Date) => c ? c.toISOString().substr(0, 10) : '';

export default class SnapshotCtrl extends BaseCtrl {
  model = Snapshot;

  _areEqual(a, b): any {
    return keys.reduce((result, key) => {
      let [c, d] = [a[key], b[key]];
      if (dateKeys.includes(key)) {
        [c, d] = [redate(c), redate(d)];
      } else if (deepsKeys.includes(key)) {
        let modifier = deeps[key];
        [c, d] = [modifier(c), modifier(d)];
      } else if (Array.isArray(c) && Array.isArray(d)) {
        [c, d] = [c.sort().join(','), d.sort().join(',')];
      }

      c = !!c ? c : '';
      d = !!d ? d : '';
      if (c != d) {
        result[key] = [c, d];
      }
      return result;
    }, {});
  }

  _saveDiffDelayed(diff: any, type: string) {
    if (type !== 'c' || (
      typeof diff.diff === 'object' &&
      Object.keys(diff.diff).length >= 2 &&
      (diff.diff.updated || [0])[0] <= (diff.diff.updated || [0, 1])[1]
    )) {
      new Diff(diff).save();
    }
  }

  makeDiff = (current, type: string) => {
    this.model.find({ type }).sort({ date: 1 }).limit(1).exec((err, docs) => {
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
            this._saveDiffDelayed(diff, type);
          } else if (!updated['_id']) {
            diff.diff = -1;
            this._saveDiffDelayed(diff, type);
          } else {
            let fields = this._areEqual(state, updated);
            if (Object.keys(fields).length) {
              diff.diff = fields;
              this._saveDiffDelayed(diff, type);
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
        this.makeDiff(updated, entity);
        resolve();
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
