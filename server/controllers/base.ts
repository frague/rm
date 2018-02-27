import * as mongoose from 'mongoose';

const keywordExtender = new RegExp(/\.[^\s]+$/);

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

      if (key === this.andKey) {
        let and = this.modifyCriteria(value, modifiers);
        let l = and.length;
        if (l) {
          if (l === 1) {
            or = or.concat(and);
          } else {
            or.push({[this.andKey]: and});
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
    return {[this.orKey]: or};
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
      return {'$and': [{'comments.source': source}, {'comments.text': value}]};
    } else {
      key += '.text';
    }
    return {[key]: value};
  }

  // Get all
  getAll = (req, res) => {
    let query = this.reduceQuery(req.query);
    console.log('Finding all', query);
    this.model.find(query, (err, docs) => {
      if (err) {
        return console.error(err);
      }
      res.json(docs);
    });
  }

  // Count all
  count = (req, res) => {
    this.model.count((err, count) => {
      if (err) {
        return console.error(err);
      }
      res.json(count);
    });
  }

  // Insert
  insert = (req, res) => {
    const obj = new this.model(req.body);
    obj.save((err, item) => {
      // 11000 is the code for duplicate key error
      if (err && err.code === 11000) {
        res.sendStatus(400);
      }
      if (err) {
        return console.error(err);
      }
      res.status(200).json(item);
    });
  }

  // Get by id
  get = (req, res) => {
    this.model.findOne({ _id: req.params.id }, (err, obj) => {
      if (err) {
        return console.error(err);
      }
      res.json(obj);
    });
  }

  // Update by id
  update = (req, res) => {
    this.model.findOneAndUpdate({ _id: req.params.id }, req.body, {new: true}, (err, item) => {
      if (err) {
        return console.error(err);
      }
      res.status(200).json(item);
    });
  }

  // Delete by id
  delete = (req, res) => {
    this.model.findOneAndRemove({ _id: req.params.id }, (err) => {
      if (err) {
        return console.error(err);
      }
      this.cleanup(req, res);
    });
  }

  // Delete all
  deleteAll = (req, res) => {
    this.model.remove({}, (err) => {
      if (err) {
        return console.error(err);
      }
      res.sendStatus(200);
    });
  }
}

export default BaseCtrl;
