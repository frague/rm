import Filter from '../models/filter';
import Comment from '../models/comment';
import Plan from '../models/demandplan';

const models = {
  comments: Comment,
  filters: Filter,
  plans: Plan
};

export default class BackupCtrl {

  download = (req, res) => {
    Promise.all([Comment, Filter, Plan].map(model => model.find({})))
      .then(([comments, filters, plans]) => {
        console.log('- Backup -----------------------------------------------------');
        console.log(`${comments.length} comments`);
        console.log(`${filters.length} filters`);
        console.log(`${plans.length} demand plans`);

        res.attachment('rm_comments_' + (new Date()).toISOString().substr(0, 10) + '.json');
        res.setHeader('Content-type', 'application/json');
        res.json({comments, filters, plans})
      })
      .catch(error => {
        console.log('Backup creation error:', error);
        res.sendStatus(500);
      });
  }

  restore = (req, res) => {
    if (req.body && req.body.backup && req.body.backup.value) {
      console.log('- Backup restore -----------------------------------------------');
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

          return model.deleteMany({}, (err) => {
            let items = data[key];
            items.forEach(itemData => {
              delete itemData['__v'];
              new model(itemData).save();
            });
            result.push(items.length + ' ' + key + ' were successfully restored from backup');
          });
        })
      )
        .then(() => {
          return res.send(result.join('\n'));
        })
        .catch(error => {
          console.log('Error restoring from backup:', error);
          return res.sendStatus(500);
        });
    } else {
      return res.sendStatus(500);
    }
  }

}