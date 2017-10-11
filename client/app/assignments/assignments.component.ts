import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastComponent } from '../shared/toast/toast.component';

import { BaseComponent } from '../base.component';

import { AssignmentService } from '../services/assignment.service';
import { InitiativeService } from '../services/initiative.service';
import { ResourceService } from '../services/resource.service';

@Component({
  selector: 'assignments',
  templateUrl: './assignments.component.html',
  styleUrls: ['./assignments.component.scss']
})
export class AssignmentsComponent extends BaseComponent implements OnInit {

  resources = [];
  initiatives = {};
  assignments = [];
  item = {};
  isLoading = true;

  public form = new FormGroup({
    _id: new FormControl(''),
    resourceId: new FormControl('', Validators.required),
    initiativeId: new FormControl('', Validators.required),
    start: new FormControl('', Validators.required),
    end: new FormControl('', Validators.required),
    isBillable: new FormControl(''),
    involvement: new FormControl('100', Validators.required),
    comment: new FormControl('')
  });

  constructor(
    assignmenService: AssignmentService,
    private resourceService: ResourceService,
    private initiativeService: InitiativeService,
    private toast: ToastComponent
  ) {
    super(assignmenService);
  }

  getInitiatives() {
    return Object.values(this.initiatives);
  }

  ngOnInit() {
    this.getAll();
    this.resourceService.getAll().subscribe(
      data => this.resources = data,
      error => console.log(error)
    );
    this.initiativeService.getAll().subscribe(
      data => {
        this.initiatives = data.reduce((result, initiative) => {
          result[initiative._id] = initiative;
          return result;
        }, {})
      },
      error => console.log(error)
    );
  }

  getAll() {
    return super.getAll();
  }

  showAssignment(assignment) {
    let initiative = this.initiatives[assignment.initiativeId];
    return {
      name: initiative.name,
      offset: 1000 * Math.random(),
      width: 50 + 50 * Math.random()
    }
  }
}
