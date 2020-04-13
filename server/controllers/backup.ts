import * as mongoose from 'mongoose';

import Filter from '../models/filter';
import Plan from '../models/demandplan';
import Resource from '../models/resource';
import Demand from '../models/demand';
import Requisition from '../models/requisition';
import Candidate from '../models/candidate';
import Badge from '../models/badge';
import ItemBadge from '../models/itemBadge';
import { printTitle } from '../utils';

import Comment from '../models/comment';

const entities = [Resource, Demand, Requisition, Candidate];
const idsFields = ['login', 'login', 'requisitionId', 'login'];

const models = {
  comments: Comment,
  filters: Filter,
  plans: Plan,
  badges: Badge,
  itemBadges: ItemBadge,
};

export default class BackupCtrl {

  private _duplicates = {};

  download = (req, res) => {
    Promise.all([Comment, Filter, Plan, Badge, ItemBadge].map(model => model.find({})))
      .then(([comments, filters, plans, badges, itemBadges]) => {
        printTitle('Backup');

        console.log(`${comments.length} comments`);
        console.log(`${filters.length} filters`);
        console.log(`${plans.length} demand plans`);
        console.log(`${badges.length} badges`);
        console.log(`${itemBadges.length} item badges`);

        res.attachment('rm_comments_' + (new Date()).toISOString().substr(0, 10) + '.json');
        res.setHeader('Content-type', 'application/json');
        res.json({comments, filters, plans, badges, itemBadges})
      })
      .catch(error => {
        console.log('Backup creation error:', error);
        res.sendStatus(500);
      });
  }

  restore = (req, res) => {
    if (req.body && req.body.backup && req.body.backup.value) {
      console.log('- Backup restore -----------------------------------------------');
      let merge = !!req.body.merge;
      console.log('Merge: ', merge);
      let data: any;
      try {
        data = JSON.parse(new Buffer(req.body.backup.value, 'base64').toString());
      } catch (error) {
        console.log('Backup restoring error:', error);
        return res.sendStatus(500);
      }

      let result = [];
      Promise.all(
        Object.keys(models).map(key => {
          let model = models[key];

          // Custom merging
          if (merge) {
            switch (key) {
              case 'comments':
                return this._mergeComments(data[key], result);
              case 'badges':
                return this._mergeBadges(data[key], result);
              case 'itemBadges':
                return Promise.resolve();
            }
          }

          // Overwriting
          return model.deleteMany({})
            .exec()
            .then(() => {
              let items = data[key];
              items.forEach(itemData => {
                delete itemData['__v'];
                new model(itemData)
                  .save()
                  .then(
                    data => {},
                    error => console.log(`Error saving ${key}:`, itemData)
                  );
              });
              let r = items.length + ' ' + key + ' were successfully restored from backup';
              result.push(r);
              console.log(r);
            })
            .catch(error => console.log(`Error deleting ${key}`));
        })
      )
        .then(() => {
          if (merge) {
            return this._mergeItemBadges(data['itemBadges'], result)
              .then(() => res.json(result));
          } else {
            return res.json(result);
          }
        })
        .catch(error => {
          console.log('Error restoring from backup:', error);
          return res.sendStatus(500);
        });
    } else {
      return res.sendStatus(500);
    }
  }

  private _mergeComments = (externalComments: any[], result: any[]) => {
    return Comment.find({})
      .exec()
      .then(innerComments => {
        let commentsById = innerComments.reduce((p, item) => {
          p[item._id] = item;
          return p;
        }, {});

        let added = 0;
        let updated = 0;
        externalComments.forEach(comment => {
          delete comment['__v'];
          let existingComment = commentsById[comment._id];
          if (comment.source !== 'Account management') {
            // Comment isn't automatically generated
            if (!existingComment || existingComment.date < comment.date) {
              // Record should be updated or created
              if (!existingComment) {
                added++;
                console.log('Add: ', comment);
              } else {
                updated++;
              }
              new Comment(comment)
                .save()
                .then(
                  data => {},
                  error => console.log(`Error saving comment:`, comment)
                );
            }
          }
        });
        let r = `Comments merged with the backup: ${added} added, ${updated} updated`;
        result.push(r);
        console.log(r);
      })
      .catch(error => console.log(`Error fetching comments`));
  }

  private _mergeBadges = (externalBadges: any[], result: any[]) => {
    this._duplicates = {};
    return Badge.find({})
      .exec()
      .then(innerBadges => {
        let badgesByTitle = innerBadges.reduce((p, item) => {
          p[item.title] = item;
          return p;
        }, {});

        let added = 0;
        let updated = 0;
        externalBadges.forEach(badge => {
          delete badge['__v'];
          let existingBadge = badgesByTitle[badge.title];
          if (existingBadge) {
            if (badge._id === existingBadge._id) {
              // Existing color will be overridden
              updated++;
            } else {
              // Badge with such title already exists
              // Add its id to substitute
              this._duplicates[badge._id] = existingBadge._id;
              console.log(`Duplicate badge ${badge.title} found`);
              return;
            }
          } else {
            added++;
            console.log(`Badge ${badge.title} has been added`);
          }

          new Badge(badge)
            .save()
            .then(
              data => {},
              error => console.log(`Error saving badge:`, badge.title)
            );
        });
        let r = `Badges merged with the backup: ${added} added, ${updated} updated`;
        result.push(r);
        console.log(r);
      })
      .catch(error => console.log(`Error fetching badges`));
  }

  private _mergeItemBadges = (externalItemBadges: any[], result: any[]) => {
    return ItemBadge.find({})
      .exec()
      .then(innerItemBadges => {
        let links = innerItemBadges.reduce((p, item) => {
          p[`${item.itemId}:${item.badgeId}`] = item;
          return p;
        }, {});

        let added = 0;
        externalItemBadges.forEach(itemBadge => {
          delete itemBadge['__v'];
          let dup = this._duplicates[itemBadge.badgeId];
          if (dup) {
            itemBadge.badgeId = dup;
          }
          let existingBadge = links[`${itemBadge.itemId}:${itemBadge.badgeId}`];
          if (!existingBadge) {
            added++;
            new ItemBadge(itemBadge)
              .save()
              .then(
                data => {},
                error => console.log(`Error saving item badge:`, itemBadge)
              );
          }

        });
        let r = `Item badges merged with the backup: ${added} added`;
        result.push(r);
        console.log(r);
      })
      .catch(error => console.log(`Error fetching badges`));
  }

  private _queryModel = (model: mongoose.Schema, idName: string): Promise<any[]> => {
    return model.aggregate([
      {
        '$group': {
          _id: null,
          ids: {'$push': '$' + idName}
        }
      }
    ])
      .then(data => data[0].ids);
  }

  cleanup = async (req, res) => {
    // TODO: Implement itemBadges cleanup
    Promise.all(entities.map((model, index) =>
      this._queryModel(model, idsFields[index])
    ))
      .then(results => {
        // All system' comments start with '%' so exclude them
        let ids = [/^%/].concat(...results);
        Comment
          .find({login: {'$nin': ids}})
          .exec()
          .then(data => {
            let logins = data.reduce((result, comment) => {
              result[comment.login] = (result[comment.login] || 0) + 1;
              return result;
            }, {});
            console.log(logins);
            Comment
              .deleteMany({login: {'$nin': ids}})
              .exec()
              .then(() => res.json({deleted: data.length, logins}));
          });
      })
      .catch(error => res.sendStatus(500));
  }

}