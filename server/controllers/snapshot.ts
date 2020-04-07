import Snapshot from '../models/snapshot';
import Resource from '../models/resource';
import Demand from '../models/demand';
import Candidate from '../models/candidate';
import Comment from '../models/comment';
import Diff from '../models/diff';
import DiffCtrl from '../controllers/diff';
import BaseCtrl from './base';

var diffCtrl = new DiffCtrl();
const accountManagementSource = 'Account management';
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
  'proposed',
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
  'CV',
  'Account Directors',
  'Delivery Directors',
  'Customer Partners',
  'Delivery Managers',
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

  _modifyCandidates(source: any) {
    if (!source || !source.candidates || !source.candidatesStati) return source;
    let stati = source.candidatesStati;
    source.proposed = source.candidates
      .filter(candidate => !!candidate)
      .map((candidate, index) => `${candidate} (${stati[index]})`)
      .sort((a, b) => {
        [[a], [b]] = [a.split(' ('), b.split(' (')];
        return a < b ? -1 : 1;
      });
    return source;
  }

  _joinArray(value, key) {
    if (!Array.isArray(value)) return value;
    return key === 'proposed' ? value.join(',') : value.sort().join(',');
  };

  _areEqual(prev, actual): any {
    prev = this._modifyCandidates(prev);
    actual = this._modifyCandidates(actual);

    return keys.reduce((result, key) => {
      let [c, d] = [prev[key], actual[key]];
      if (dateKeys.includes(key)) {
        [c, d] = [redate(c), redate(d)];
      } else if (deepsKeys.includes(key)) {
        let modifier = deeps[key];
        [c, d] = [modifier(c), modifier(d)];
      } else {
        c = this._joinArray(c, key);
        d = this._joinArray(d, key);
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
        if (err) return reject(err);
        let updated = docs.reduce((result, doc) => {
          result[doc.login] = doc;
          return result;
        }, {});
        this.makeDiff(updated, entity);
        resolve();
      });
    });
  }

  _parseTitle(data: string): any {
    let lines = data.split('\n\n');
    let title = lines.splice(0, 1);
    let management = lines.reduce((result, line) => {
      let [managers, list] = line.split(': ');
      result[managers] = list.split(', ');
      return result;
    }, {});
    return [
      title[0].replace(/\./g, ' dot ').replace('## ', ''),
      management
    ];
  }

  saveAMDiff(): Promise<any> {
    return new Promise((resolve, reject) => {
      Comment.find({source: accountManagementSource}, (err, docs) => {
        if (err) return reject(err);
        let updated = docs.reduce((result, doc) => {
          let [login, management] = this._parseTitle(doc.text);
          if (login) {
            result[login] = Object.assign(
              {
                _id: doc._id,
                login,
              },
              management
            )
          }
          return result;
        }, {});
        this.makeDiff(updated, 'a');
        resolve();
      })
    });
  }

  saveDiffs = (req, res) => {
    Promise.all([
      this.saveDiff(Resource, 'r'),
      this.saveDiff(Demand, 'd'),
      this.saveDiff(Candidate, 'c'),
      this.saveAMDiff()
    ])
      .then(() => {
        res.json({});
      })
      .catch(err => {
        console.log(err);
        res.sendStatus(500);
      });
  }
}
