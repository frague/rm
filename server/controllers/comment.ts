import Comment from '../models/comment';
import BaseCtrl from './base';

export default class CommentCtrl extends BaseCtrl {
  model = Comment;

  // Get all
  getAll = (req, res) => {
    let query = this.reduceQuery(req.query);
    console.log('Finding all', query);
    this.model
      .find(query)
      .sort({date: -1})
      .exec((err, docs) => {
        if (err) { return console.error(err); }
        res.json(docs);
      });
  }

    // Insert
  insertChecked = (req, res) => {
    let query = req.body;
    if (query.isStatus === true && query.login) {
      console.log('Do reset!');
      this.model.update({login: query.login}, {isStatus: false}, {multi: true}, (err, data) => {
        return this.insert(req, res);
      });
    } else {
      return this.insert(req, res);
    }
  }

  updateChecked = (req, res) => {
    let query = req.body;
  	if (query.isStatus === true && query.login) {
  		this.model.update({login: query.login}, {isStatus: false}, {multi: true}, (err, data) => {
        return this.update(req, res);
      });
  	} else {
      return this.update(req, res);
    }
  }


}
