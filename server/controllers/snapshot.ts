import Snapshot from '../models/snapshot';
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
      if (dateKeys.indexOf(key) >= 0) {
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

  makeDiff = snapshot => {
    this.model.find({}).sort({date: 1}).limit(1).exec((err, docs) => {
      if (docs.length) {
        let prev = docs[0].snapshot;
        let today = new Date();

        Object.keys(prev).forEach(login => {
          let state = prev[login] || {};
          let updated = snapshot[login] || {};
          let diff: any = {
            date: today,
            subject: login
          };
          let fields = this.areEqual(state, updated);
          if (Object.keys(fields).length) {
            diff.diff = fields;
            new Diff(diff).save();
          }
        });
      }
      this.model.deleteMany({}, (err) => {
        new this.model({
          date: new Date(),
          snapshot
        }).save();
      })
    });
  }
}
