import * as mongoose from 'mongoose';

abstract class BaseCtrl {

  abstract model: mongoose.Schema;

  andKey = '$and';
  orKey = '$or';

  cleanup = (req, res) => res.sendStatus(200);

  reduceQuery(query: any) {
    return Object.keys(query).reduce((result, param) => {
      result[param] = JSON.parse(query[param]);
      return result;
    }, {});
  }

  filterCriteria = (source: any[], filterExpression: RegExp|Function, condition = this.orKey, transform: Function = (key, value) => ({[key]: value})): any => {
    let result = [];
    let filter = filterExpression instanceof RegExp ? key => filterExpression.test(key) : filterExpression;
    source.forEach(item => {
      item = item || {};
      let key = Object.keys(item)[0];
      if (key === this.andKey) {
        let and = this.filterCriteria(item[key], filterExpression, this.andKey, transform);
        if (and) {
          result.push(and);
        }
      } else if (filter(key)) {
        result.push(transform(key, item[key]));
      }
    });
    return result.length ? (result.length === 1 ? result[0]: {[condition]: result}) : null;
  };

  commentTransform = (key, value) => {
    if (key.indexOf('.') >= 0) {
      let [comment, source] = key.split('.', 2);
      return {[this.andKey]: [{'comments.source': source}, {'comments.text': value}]};
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
