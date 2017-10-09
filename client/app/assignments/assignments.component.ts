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

  resource = {};
  resources = [];
  resourceService: ResourceService;
  isLoading = true;
  locations = ['SAR', 'SPB', 'MP', 'KHR', 'LV'];
  pools = ['ML', 'UI'];

  public form = new FormGroup({
    name: new FormControl('', Validators.required),
    login: new FormControl('', Validators.required),
    grade: new FormControl('', Validators.required),
    location: new FormControl('', Validators.required),
    pool: new FormControl('', Validators.required)
  });

  constructor(
    resourceService: ResourceService,
    private toast: ToastComponent
  ) {
    super(resourceService);
  }

  ngOnInit() {
    this.getAll();
  }
}
