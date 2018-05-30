import * as mongoose from 'mongoose';

const keywordExtender = new RegExp(/\.[^\s]+$/);
const funcValue = new RegExp(/^([a-z]+)\(/i);
const valueModifiers = {
  'in': (key, value, [days]) => {
    let d = new Date();
    d.setDate(d.getDate() + +days);
    return { [key]: { '$gte': new Date(), '$lt': d }};
  },
  'after': (key, value, [days]) => {
    let d = new Date();
    d.setDate(d.getDate() + +days);
    return { [key]: { '$gte': d }};
  },
  null: (key, value) => {
    return { [key]: value };
  }
};

abstract class BaseCtrl {

  abstract model: mongoose.Schema;

  andKey = '$and';
  orKey = '$or';

  cleanup = (req, res) => res.sendStatus(200);

  modifyCriteria(criteria: any[], modifiers: any = {}): any[] {
    let or = [];
    let inclusions = modifiers.include || [];
    let useWhitelist = inclusions.length > 0;
    let exclusions = useWhitelist ? [] : modifiers.exclude || [];

    criteria.forEach(criterion => {
      if (!criterion) return;
      let key = Object.keys(criterion)[0];
      let value = criterion[key];
      let keyBase = key.replace(keywordExtender, '');

      // Values modifiers
      criterion = this._modifyValue(key, value);

      if (key === this.andKey) {
        let and = this.modifyCriteria(value, modifiers);
        let l = and.length;
        if (l) {
          if (l === 1) {
            or = or.concat(and);
          } else {
            or.push({ [this.andKey]: and });
          }
        }
        return;
      }

      if ((!useWhitelist && exclusions.includes(keyBase)) || (useWhitelist && !inclusions.includes(keyBase))) {
        return;
      }

      if (modifiers[keyBase]) {
        criterion = modifiers[keyBase](key, value);
      }

      if (criterion) {
        or.push(criterion);
      }
    });
    return or;
  }

  fixOr(or: any[]) {
    let l = or.length;
    if (!l) {
      return {};
    }
    if (l === 1) {
      return or[0];
    }
    return { [this.orKey]: or };
  }

  reduceQuery(query: any) {
    return Object.keys(query).reduce((result, param) => {
      result[param] = JSON.parse(query[param]);
      return result;
    }, {});
  }

  commentTransform = (key, value) => {
    if (key.indexOf('.') >= 0) {
      let [comment, source] = key.split('.', 2);
      return {'$and': [{'comments.source': source}, { 'comments.text': value }]};
    } else {
      key += '.text';
    }
    return { [key]: value };
  }

  _respondWithError(res, error='') {
    console.log('Error:', error);
    res.sendStatus(500);
  }

  _getParameters(value: string): string[] {
    return value
      .replace(funcValue, '')
      .replace(/\)$/, '')
      .split(',')
      .map((p: string) => p.trim());
  }

  _modifyValue(key, value: string): any {
    try {
      let method = funcValue.exec(value)[1];
      return valueModifiers[method](key, value, this._getParameters(value));
    } catch (e) {
      console.log('Unable to modify value', value);
    }
    return { [key]: value };
  }

  // Get all
  getAll = (req, res) => {
    let query = this.reduceQuery(req.query);
    console.log('Finding all', query);
    this.model.find(query, (err, docs) => {
      if (err) {
        return this._respondWithError(res, err);
      }
      res.json(docs);
    });
  }

  // Count all
  count = (req, res) => {
    this.model.count((err, count) => {
      if (err) {
        return this._respondWithError(res, err);
      }
      res.json(count);
    });
  }

  // Insert
  insert = (req, res) => {
    const obj = new this.model(req.body);
    obj.save((err, item) => {
      // 11000 is the code for duplicate key error
      if (err) {
        if (err.code === 11000) {
          return res.sendStatus(400);
        } else {
          return this._respondWithError(res, err);
        }
      }
      res.json(item);
    });
  }

  // Get by id
  get = (req, res) => {
    this.model.findOne({ _id: req.params.id }, (err, obj) => {
      if (err) {
        return this._respondWithError(res, err);
      }
      res.json(obj);
    });
  }

  // Update by id
  update = (req, res) => {
    this.model.findOneAndUpdate({ _id: req.params.id }, req.body, {new: true}, (err, item) => {
      if (err) {
        return this._respondWithError(res, err);
      }
      res.status(200).json(item);
    });
  }

  // Delete by id
  delete = (req, res) => {
    this.model.findOneAndRemove({ _id: req.params.id }, (err) => {
      if (err) {
        return this._respondWithError(res, err);
      }
      this.cleanup(req, res);
    });
  }

  // Delete all
  deleteAll = (req, res) => {
    this.model.remove({}, (err) => {
      if (err) {
        return this._respondWithError(res, err);
      }
      res.sendStatus(200);
    });
  }
}

export default BaseCtrl;
