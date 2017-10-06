import * as express from 'express';

import ResourceCtrl from './controllers/resource';
import UserCtrl from './controllers/user';
import Resource from './models/resource';
import User from './models/user';

export default function setRoutes(app) {

  const router = express.Router();

  const resourceCtrl = new ResourceCtrl();
  const userCtrl = new UserCtrl();

  // Cats
  router.route('/resources').get(resourceCtrl.getAll);
  router.route('/resources/count').get(resourceCtrl.count);
  router.route('/resource').post(resourceCtrl.insert);
  router.route('/resource/:id').get(resourceCtrl.get);
  router.route('/resource/:id').put(resourceCtrl.update);
  router.route('/resource/:id').delete(resourceCtrl.delete);

  // Users
  router.route('/login').post(userCtrl.login);
  router.route('/users').get(userCtrl.getAll);
  router.route('/users/count').get(userCtrl.count);
  router.route('/user').post(userCtrl.insert);
  router.route('/user/:id').get(userCtrl.get);
  router.route('/user/:id').put(userCtrl.update);
  router.route('/user/:id').delete(userCtrl.delete);

  // Apply the routes to our application with the prefix /api
  app.use('/api', router);

}
