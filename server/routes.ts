import * as express from 'express';

import ResourceCtrl from './controllers/resource';
import InitiativeCtrl from './controllers/initiative';
import AssignmentCtrl from './controllers/assignment';
import UserCtrl from './controllers/user';
import DemandCtrl from './controllers/demand';
import FilterCtrl from './controllers/filter';
import SyncCtrl from './controllers/sync';
import CommentCtrl from './controllers/comment';
import DemandPlanCtrl from './controllers/demandplan';
import DiffCtrl from './controllers/diff';
import SnapshotCtrl from './controllers/snapshot';
import CandidateCtrl from './controllers/candidate';
import RequisitionCtrl from './controllers/requisition';
import BackupCtrl from './controllers/backup';
import RequisitionDemandCtrl from './controllers/requisitionDemand';
import BadgeCtrl from './controllers/badge';
import ItemBadgeCtrl from './controllers/itemBadge';

import InGridCtrl from './controllers/integrations/ingrid';
import PmoIntegrationsCtrl from './controllers/integrations/pmo';
import SkillTreeCtrl from './controllers/integrations/skilltree';
import BambooIntegrationsCtrl from './controllers/integrations/bamboo';
import StaffingToolCtrl from './controllers/integrations/staffingTool';

import Resource from './models/resource';
import User from './models/user';

var multer = require("multer");
var upload = multer();  // Handles multipart/form-data requests

export default function setRoutes(app) {

  const router = express.Router();

  const resourceCtrl = new ResourceCtrl();
  const initiativeCtrl = new InitiativeCtrl();
  const assignmentCtrl = new AssignmentCtrl();
  const userCtrl = new UserCtrl();
  const demandCtrl = new DemandCtrl();
  const filterCtrl = new FilterCtrl();
  const syncCtrl = new SyncCtrl();
  const commentCtrl = new CommentCtrl();
  const demandPlanCtrl = new DemandPlanCtrl();
  const diffCtrl = new DiffCtrl();
  const snapshotCtrl = new SnapshotCtrl();
  const candidateCtrl = new CandidateCtrl();
  const requisitionCtrl = new RequisitionCtrl();
  const skillTreeCtrl = new SkillTreeCtrl();
  const inGridCtrl = new InGridCtrl();
  const requisitionDemandCtrl = new RequisitionDemandCtrl();
  const badgeCtrl = new BadgeCtrl();
  const itemBadgeCtrl = new ItemBadgeCtrl();

  const bamboo = new BambooIntegrationsCtrl();
  const pmo = new PmoIntegrationsCtrl();
  const stuffing = new StaffingToolCtrl();

  const backupCtrl = new BackupCtrl();

  // Assignments
  //router.route('/assignment/:id').get(assignmentCtrl.get);
  router.route('/assignment').post(assignmentCtrl.insert);
  router.route('/assignments').get(assignmentCtrl.getAll);
  router.route('/assignment/:id').put(assignmentCtrl.update);
  router.route('/assignments/count').get(assignmentCtrl.count);
  router.route('/assignment/:id').delete(assignmentCtrl.delete);
  router.route('/assignments').delete(assignmentCtrl.deleteAll);
  router.route('/assignment/:login').get(pmo.getAssignments);

  // Resources
  router.route('/resources').get(resourceCtrl.getAll);
  router.route('/resource').post(resourceCtrl.insert);
  router.route('/resource/:id').get(resourceCtrl.get);
  router.route('/resource/:id').put(resourceCtrl.update);
  router.route('/resources/count').get(resourceCtrl.count);
  router.route('/resource/:id').delete(resourceCtrl.delete);
  router.route('/resources').delete(resourceCtrl.deleteAll);

  // Initiatives
  router.route('/initiatives').get(initiativeCtrl.getAll);
  router.route('/initiative').post(initiativeCtrl.insert);
  router.route('/initiative/:id').get(initiativeCtrl.get);
  router.route('/initiative/:id').put(initiativeCtrl.update);
  router.route('/initiatives/count').get(initiativeCtrl.count);
  router.route('/initiative/:id').delete(initiativeCtrl.delete);
  router.route('/initiatives').delete(initiativeCtrl.deleteAll);

  // Comments
  router.route('/comment/:id').get(commentCtrl.get);
  router.route('/comments').get(commentCtrl.getAll);
  router.route('/comments/count').get(commentCtrl.count);
  router.route('/comment/:id').delete(commentCtrl.delete);
  router.route('/comments').delete(commentCtrl.deleteAll);
  router.route('/comment').post(commentCtrl.insertChecked);
  router.route('/comment/:id').put(commentCtrl.updateChecked);

  // Demand plans
  router.route('/plans').get(demandPlanCtrl.getAll);
  router.route('/plan').post(demandPlanCtrl.insert);
  router.route('/plan/:id').get(demandPlanCtrl.get);
  router.route('/plan/:id').put(demandPlanCtrl.update);
  router.route('/plans/count').get(demandPlanCtrl.count);
  router.route('/plan/:id').delete(demandPlanCtrl.delete);
  router.route('/plans').delete(demandPlanCtrl.deleteAll);

  // Demands
  router.route('/demands').get(demandCtrl.getAll);
  router.route('/demand').post(demandCtrl.insert);
  router.route('/demand/:id').get(demandCtrl.get);
  router.route('/demand/:id').put(demandCtrl.update);
  router.route('/demands/count').get(demandCtrl.count);
  router.route('/demand/:id').delete(demandCtrl.delete);
  router.route('/demands').delete(demandCtrl.deleteAll);

  // Candidates
  router.route('/candidates').get(candidateCtrl.getAll);

  // Reqiusitions
  router.route('/requisitions').get(requisitionCtrl.getAll);
  router.route('/requisition/:id').get(requisitionCtrl.get);

  // Users
  router.route('/login').post(userCtrl.login);
  router.route('/users').get(userCtrl.getAll);
  router.route('/user').post(userCtrl.insert);
  router.route('/user/:id').get(userCtrl.get);
  router.route('/user/:id').put(userCtrl.update);
  router.route('/users/count').get(userCtrl.count);
  router.route('/user/:id').delete(userCtrl.delete);

  // Filters
  router.route('/filters').get(filterCtrl.getAll);
  router.route('/filter').post(filterCtrl.insert);
  router.route('/filter/:id').get(filterCtrl.get);
  router.route('/filter/:id').put(filterCtrl.update);
  router.route('/filters').delete(filterCtrl.deleteAll);
  router.route('/filter/:id').delete(filterCtrl.delete);

  // Requisition Demands
  router.route('/rds').get(requisitionDemandCtrl.getAll);
  router.route('/rd').post(requisitionDemandCtrl.insert);
  router.route('/rd/:id').get(requisitionDemandCtrl.get);
  router.route('/rd/:id').put(requisitionDemandCtrl.update);
  router.route('/rds').delete(requisitionDemandCtrl.deleteAll);
  router.route('/rd/:id').delete(requisitionDemandCtrl.delete);

  // Badges
  router.route('/badges').get(badgeCtrl.getAll);
  router.route('/badges/:id').get(badgeCtrl.getAllFor);
  router.route('/badge').post(badgeCtrl.insert);
  router.route('/badge/:id').get(badgeCtrl.get);
  router.route('/badge/:id').put(badgeCtrl.update);
  router.route('/badges').delete(badgeCtrl.deleteAll);
  router.route('/badge/:id').delete(badgeCtrl.delete);

  // Items Badges
  router.route('/ibs').get(itemBadgeCtrl.getAll);
  router.route('/ib').post(itemBadgeCtrl.insert);
  router.route('/ibs').delete(itemBadgeCtrl.deleteAll);
  router.route('/ib/:itemId/:badgeId').delete(itemBadgeCtrl.delete);

  // Sync
  router.route('/sync').post(syncCtrl.sync);

  // Skill Tree
  router.route('/skills/:userId').get(skillTreeCtrl.querySkills);
  router.route('/skills/:userId/info').get(skillTreeCtrl.queryUsersInfo);
  // router.route('/skilltree').get(skillTreeCtrl.queryLogin);

  // InGrid feedbacks
  router.route('/ingrid/:userId').get(inGridCtrl.queryFeedbacksFor);
  router.route('/ingrid/:userId/orgchart').get(inGridCtrl.queryOrgchartFor);

  // Backup and restore
  router.route('/backup').get(backupCtrl.download);
  router.route('/restore').post(upload.single('backup'), backupCtrl.restore);
  router.route('/cleanup').get(backupCtrl.cleanup);

  // Deadpool
  router.route('/dps').get(diffCtrl.getAll);
  router.route('/dps').post(snapshotCtrl.saveDiffs);
  router.route('/updated').get(diffCtrl.getLastUpdate);

  // Bamboo
  router.route('/career/:bambooId').get(bamboo.getCareer);
  // router.route('/report').get(bamboo.getReport);

  // router.route('/people').get(pmo.getPeopleRequest);
  router.route('/stuffing').get(stuffing.getDemands);

  // Apply the routes to our application with the prefix /api
  app.use('/api', router);

}
