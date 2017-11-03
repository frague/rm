import { Component, OnInit } from '@angular/core';
import { ToastComponent } from '../shared/toast/toast.component';

import { BaseComponent } from '../base.component';

import { AssignmentService } from '../services/assignment.service';
import { InitiativeService } from '../services/initiative.service';
import { ResourceService } from '../services/resource.service';
import { DemandService } from '../services/demand.service';

import { PersonComponent } from '../people/person.component';

import { Schedule } from '../schedule';

const demandPrefix = 'Demand';

@Component({
  selector: 'accounts',
  templateUrl: './accounts.component.html'
})
export class AccountsComponent extends Schedule implements OnInit {

  resources = [];
  resourcesById = {};

  initiatives = {};
  assignments = [];
  item = {};

  accountInitiatives = {};
  accountsAssignments = {};
  initiativeAssignments = {};

  constructor(
    assignmentService: AssignmentService,
    private resourceService: ResourceService,
    private initiativeService: InitiativeService,
    private demandService: DemandService,
    private toast: ToastComponent
  ) {
    super(assignmentService);
  }

  getInitiatives() {
    return Object.values(this.initiatives);
  }

  getAssignmentsCount(initiative) {
    return 'an' + this.getPersonInitiativeAssignments(initiative).length;
  }

  getAccounts() {
    return Object.keys(this.accountInitiatives).sort();
  }

  getPersonInitiativeAssignments(initiative) {
    return Object.keys(this.initiativeAssignments[initiative._id] || {})
  }

  _push(collection: any, key: string, item: any, makeUnique=true) {
    collection[key] = collection[key] || [];
    if (!makeUnique || collection[key].indexOf(item) < 0) {
      collection[key].push(item);
    }
  }

  ngOnInit() {
    this.getAll().add(() => {
      this.demandService.getAll().subscribe(demands => {
        let demandAccounts = {};
        let demandResources = [];

        demands.forEach((demand, index) => {
          let demandId = demand._id;
          let initiativeId = demandId;
          if (demandAccounts[demand.account]) {
            initiativeId = demandAccounts[demand.account];
          } else {
            demandAccounts[demand.account] = initiativeId;
          }
          demandResources.push(demand);

          let item = {
            _id: demandId,
            name: demandPrefix + index,
            assignments: [{
              _id: demandId,
              start: demand.start,
              end: demand.end,
              initiativeId,
              resourceId: demandId,
              billability: demand.role,
              involvement: 100,
              comment: demand.comment
            }],
            minDate: demand.start,
            maxDate: demand.end
          };
          this.items.push(item);
        });
        this.calculate();
        // console.log('Items', this.items);

        this.items.forEach(resource => {
          Object.keys(resource.assignments).forEach(initiativeId => {
            this.initiativeAssignments[initiativeId] = (this.initiativeAssignments[initiativeId] || {});
            this.initiativeAssignments[initiativeId][resource._id] = resource.assignments[initiativeId];
          });
        });
        // console.log('Initiatives assignments', this.initiativeAssignments);

        this.initiativeService.getAll().subscribe(
          data => {
            let demandInitiative = data.find(demand => demand.name === 'Demand');

            Object.keys(demandAccounts).forEach(account => {
              data.push(Object.assign(
                {},
                demandInitiative,
                {
                  _id: demandAccounts[account],
                  account
                }
              ));
            });

            this.initiatives = data.reduce((result, initiative) => {
              result[initiative._id] = initiative;

              this._push(this.accountInitiatives, initiative.account, initiative);

              return result;
            }, {});
            // console.log('Account initiatives', this.accountInitiatives);
          },
          error => console.log(error)
        );

        this.resourceService.getAll().subscribe(
          data => {
            demandResources.forEach(demand => data.push({
              _id: demand._id,
              name: demand.profile + ': ' + demand.comment
            }));
            console.log(demandResources);

            this.resources = data;
            this.resourcesById = data.reduce((result, person) => {
              result[person._id] = person;
              return result;
            }, {});
          },
          error => console.log(error)
        );

      });
    });
  }

  cleanup(item) {
    let clean = Object.assign({}, item);
    delete clean.offset;
    delete clean.width;
    delete clean.__v;
    clean.comment = clean.comment || '';
    return clean;
  }


  showAssignment(assignment) {
    let initiative = this.initiatives[assignment.initiativeId] || {};
    let resource = this.resourcesById[assignment.resourceId] || {};
    return {
      name: resource.name,
      account: initiative.account,
      color: initiative.color,
      billability: assignment.billability,
      involvement: assignment.involvement,
      offset: assignment.offset,
      width: assignment.width
    };
  }
}
