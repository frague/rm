import Comment from '../models/comment';
import BaseCtrl from './base';
import { printTitle } from '../utils';

export default class CommentCtrl extends BaseCtrl {
  model = Comment;

  // Get all
  getAll = (req, res) => {
    printTitle('Comments');

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

  download = (req, res) => {
    this.model.find({}, (err, data) => {
      if (err) {
        return console.error(err);
      }
      res.attachment('em_comments_' + (new Date()).toISOString().substr(0, 10) + '.json');
      res.setHeader('Content-type', 'application/json');
      res.json(data)
    });
  }

  restore = (req, res) => {
    if (req.body && req.body.backup && req.body.backup.value) {
      let comments: any[];
      try {
        comments = JSON.parse(new Buffer(req.body.backup.value, 'base64').toString());
      } catch (e) {
        return res.sendStatus(500);
      }
      this.model.deleteMany({}, (err) => {
        comments.forEach(commentData => {
          delete commentData['__v'];
          new this.model(commentData).save();
        });
        return res.send(comments.length + ' comments were successfully restored from backup');
      });
    } else {
      return res.sendStatus(500);
    }
  }

}
