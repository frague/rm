import * as express from 'express';
import { Http } from '@angular/http';

import ResourceCtrl from './controllers/resource';
import InitiativeCtrl from './controllers/initiative';
import AssignmentCtrl from './controllers/assignment';
import UserCtrl from './controllers/user';
import IntegrationsCtrl from './controllers/integrations';
import DemandCtrl from './controllers/demand';
import FilterCtrl from './controllers/filter';
import SyncCtrl from './controllers/sync';

import Resource from './models/resource';
import User from './models/user';

export default function setRoutes(app) {

  const router = express.Router();

  const resourceCtrl = new ResourceCtrl();
  const initiativeCtrl = new InitiativeCtrl();
  const assignmentCtrl = new AssignmentCtrl();
  const userCtrl = new UserCtrl();
  const integrationsCtrl = new IntegrationsCtrl();
  const demandCtrl = new DemandCtrl();
  const filterCtrl = new FilterCtrl();
  const syncCtrl = new SyncCtrl();

  // Assignments
  router.route('/assignments').get(assignmentCtrl.getAll);
  router.route('/assignments').delete(assignmentCtrl.deleteAll);
  router.route('/assignments/count').get(assignmentCtrl.count);
  router.route('/assignment').post(assignmentCtrl.insert);
  router.route('/assignment/:id').get(assignmentCtrl.get);
  router.route('/assignment/:id').put(assignmentCtrl.update);
  router.route('/assignment/:id').delete(assignmentCtrl.delete);

  // Resources
  router.route('/resources').get(resourceCtrl.getAll);
  router.route('/resources').delete(resourceCtrl.deleteAll);
  router.route('/resources/count').get(resourceCtrl.count);
  router.route('/resource').post(resourceCtrl.insert);
  router.route('/resource/:id').get(resourceCtrl.get);
  router.route('/resource/:id').put(resourceCtrl.update);
  router.route('/resource/:id').delete(resourceCtrl.delete);

  // Initiatives
  router.route('/initiatives').get(initiativeCtrl.getAll);
  router.route('/initiatives').delete(initiativeCtrl.deleteAll);
  router.route('/initiatives/count').get(initiativeCtrl.count);
  router.route('/initiative').post(initiativeCtrl.insert);
  router.route('/initiative/:id').get(initiativeCtrl.get);
  router.route('/initiative/:id').put(initiativeCtrl.update);
  router.route('/initiative/:id').delete(initiativeCtrl.delete);

  // Demands
  router.route('/demands').get(demandCtrl.getAll);
  router.route('/demands').delete(demandCtrl.deleteAll);
  router.route('/demands/count').get(demandCtrl.count);
  router.route('/demand').post(demandCtrl.insert);
  router.route('/demand/:id').get(demandCtrl.get);
  router.route('/demand/:id').put(demandCtrl.update);
  router.route('/demand/:id').delete(demandCtrl.delete);

  // Users
  router.route('/login').post(userCtrl.login);
  router.route('/users').get(userCtrl.getAll);
  router.route('/users/count').get(userCtrl.count);
  router.route('/user').post(userCtrl.insert);
  router.route('/user/:id').get(userCtrl.get);
  router.route('/user/:id').put(userCtrl.update);
  router.route('/user/:id').delete(userCtrl.delete);

  // Filters
  router.route('/filters').get(filterCtrl.getAll);
  router.route('/filters').delete(filterCtrl.deleteAll);
  router.route('/filter').post(filterCtrl.insert);
  router.route('/filter/:id').get(filterCtrl.get);
  router.route('/filter/:id').put(filterCtrl.update);
  router.route('/filter/:id').delete(filterCtrl.delete);

  // Sync
  router.route('/sync').post(syncCtrl.sync);

  // Apply the routes to our application with the prefix /api
  app.use('/api', router);

}
