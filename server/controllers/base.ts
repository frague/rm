import * as mongoose from 'mongoose';

const andKey = '$and';
const orKey = '$or';

const keywordExtender = new RegExp(/\.[^\s]+$/);
const funcValue = new RegExp(/^([a-z]+)\(/i);
const valueModifiers = {
  'in': (key, value, [days]) => {
    let d = new Date();
    d.setDate(d.getDate() + +days);
    return[key, { '$gte': new Date(), '$lt': d }, false];
  },
  'after': (key, value, [days]) => {
    let d = new Date();
    d.setDate(d.getDate() + +days);
    return [key, { '$gte': d }, false];
  },
  'empty': (key, value) => {
    return [key, null, false];
  },
  'emptySet': (key, value) => {
    return [key, { '$eq': [] }, false];
  },
  'exists': (key, value) => {
    return [key, { '$nin': [null, []], '$exists': true }, false];
  },
  'month': (key, value, [month]) => {
    if (!/^\d+$/.test('' + month)) {
      month = 1 + new Date().getMonth();
    }
    return [
      key,
      {
        '$expr': {
          '$eq': [
            {'$month': '$' + key},
            +month
          ]
        }
      },
      true
    ];
  },
  'not': (key, value, [compValue]) => {
    return [key, { '$ne': compValue }, false];
  },
  null: (key, value) => {
    return [key, value, false];
  }
};

abstract class BaseCtrl {

  abstract model: mongoose.Schema;

  // Remove related items to keep DB consistent
  cleanup = (req, res) => res.sendStatus(200);

  modifyCriteria(criteria: any[], modifiers: any = {}, group = []): any[] {
    let or = [];
    let inclusions = modifiers.include || [];
    let useWhitelist = inclusions.length > 0;
    let exclusions = useWhitelist ? [] : modifiers.exclude || [];
    let skipKey;

    criteria.forEach(criterion => {
      if (!criterion) return;
      let key = Object.keys(criterion)[0];
      let value = criterion[key];
      let keyBase = key.replace(keywordExtender, '');

      // Values modifiers
      [key, value, skipKey] = this._modifyValue(key, value);
      if (typeof value === 'string' && !value.indexOf('/')) {
        value = new RegExp(value.replace(/^\/([^\/]+)\/i$/, '$1'), 'i');
      }
      criterion = skipKey ? value : {[key]: value};

      if (key === andKey) {
        let and = this.modifyCriteria(value, modifiers, group);
        let l = and.length;
        if (l) {
          if (l === 1) {
            or = or.concat(and);
          } else {
            or.push({ [andKey]: and });
          }
        }
        return;
      } else {
        let [topKey, ] = key.split('.', 2);
        if (!group.includes(topKey)) {
          group.push(topKey);
        }
      }

      if ((!useWhitelist && exclusions.includes(keyBase)) || (useWhitelist && !inclusions.includes(keyBase))) {
        return;
      }

      if (modifiers[keyBase]) {
        criterion = modifiers[keyBase].bind(this)(key, value);
      }

      if (criterion) {
        or.push(criterion);
      }
    });
    // console.log(JSON.stringify(or));
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

  commentTransform(key, value, prefix='') {
    prefix = prefix ? `${prefix}.` : prefix;
    if (key.indexOf('.') >= 0) {
      let [comment, source] = key.split('.', 2);
      return {'$and': [{[`${prefix}comments.source`]: source}, { [`${prefix}comments.text`]: value }]};
    } else {
      key = `${prefix}${key}.text`;
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
    return [key, value, false];
  }

  _addGroup(group = {}, column: string) {
    group[column] = { '$first': `$${column}` };
  }

  determineOrder(req) {
    try {
      let orders = JSON.parse(req.query.order || '""').split(',').reduce((result, criterion) => {
        let [param, order] = criterion.split(':');
        if (+order == order) {
          if (!param.indexOf('comments.')) {
            result['comments.text'] = +order;
          } else if (/^[\S]+$/.test(param)) {
            result[param] = +order;
          }
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

  determineColumns(req): string[] {
    return JSON.parse(req.query.columns || '""').split(',');
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
        console.log('Error: ', err);
        if (err.code === 11000) {
          return res.status(400).send(err.message);
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
