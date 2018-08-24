import * as mongoose from 'mongoose';

const andKey = '$and';
const orKey = '$or';

const keywordExtender = new RegExp(/\.[^\s]+$/);
const funcValue = new RegExp(/^([a-z]+)\(/i);
const valueModifiers = {
  'in': (key, value, [days]) => {
    let d = new Date();
    d.setDate(d.getDate() + +days);
    return[key, { '$gte': new Date(), '$lt': d }];
  },
  'after': (key, value, [days]) => {
    let d = new Date();
    d.setDate(d.getDate() + +days);
    return [key, { '$gte': d }];
  },
  'empty': (key, value) => {
    return [key, null];
  },
  'exists': (key, value) => {
    return [key, { '$ne': null }];
  },
  null: (key, value) => {
    return [key, value];
  }
};

abstract class BaseCtrl {

  abstract model: mongoose.Schema;

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
      [key, value] = this._modifyValue(key, value);
      if (typeof value === 'string' && !value.indexOf('/')) {
        value = new RegExp(value.replace(/^\/([^\/]+)\/i$/, '$1'), 'i');
      }
      criterion = {[key]: value};

      if (key === andKey) {
        let and = this.modifyCriteria(value, modifiers);
        let l = and.length;
        if (l) {
          if (l === 1) {
            or = or.concat(and);
          } else {
            or.push({ [andKey]: and });
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
    return { [orKey]: or };
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
    let methodParts = funcValue.exec(value);
    if (methodParts && methodParts.length > 0) {
      let modifier = valueModifiers[methodParts[1]];
      if (modifier) {
        return modifier(key, value, this._getParameters(value));
      }
    }
    return [key, value];
  }

  determineOrder(req) {
    try {
      let orders = JSON.parse(req.query.order || '""').split(',').reduce((result, criterion) => {
        let [param, order] = criterion.split(':');
        console.log(param, order);
        if (/^[\S]+$/.test(param) && +order == order) {
          result[param] = +order;
        }
        return result;
      }, {});
      if (Object.keys(orders).length) {
        return orders;
      }
    } catch (e) {
    }
    return { name: 1 };
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

  // Delete some
  deleteMany = (criterion: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      this.model.remove(criterion, err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }

  // Delete all
  deleteAll = (req, res) => {
    this.deleteMany({})
      .then(res.sendStatus(200))
      .catch(err => this._respondWithError(res, err));
  }
}

export default BaseCtrl;
