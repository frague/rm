import Snapshot from '../models/snapshot';
import Resource from '../models/resource';
import Diff from '../models/diff';
import DiffCtrl from '../controllers/diff';
import BaseCtrl from './base';

var diffCtrl = new DiffCtrl();
const keys = ['grade','license','location','login','manager','name','passport','phone','pool','profile','room','skype','specialization','visaB','visaL'];
const dateKeys = ['passport','visaB','visaL'];

export default class SnapshotCtrl extends BaseCtrl {
  model = Snapshot;

  areEqual(a, b): any {
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

  saveDiffDelayed(diff: any) {
    new Diff(diff).save();
  }

  makeDiff = (current, res) => {
    this.model.find({}).sort({date: 1}).limit(1).exec((err, docs) => {
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
            title: updated['name'] || state['name'] || login
          };

          if (!state['_id']) {
            diff.diff = 1;
            this.saveDiffDelayed(diff);
          } else if (!updated['_id']) {
            diff.diff = -1;
            this.saveDiffDelayed(diff);
          } else {
            let fields = this.areEqual(state, updated);
            if (Object.keys(fields).length) {
              diff.diff = fields;
              this.saveDiffDelayed(diff);
            }
          }
        });
      }
      this.model.deleteMany({}, (err) => {
        new this.model({
          date: new Date(),
          snapshot: current
        }).save();
        return res.sendStatus(200);
      })
    });
  }

  saveDiffs = (req, res) => {
    Resource.find({}, (err, docs) => {
      let updated = docs.reduce((result, resource) => {
        result[resource.login] = resource;
        return result;
      }, {});
      this.makeDiff(updated, res);
    });
  }
}
