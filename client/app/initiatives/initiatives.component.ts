import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastComponent } from '../shared/toast/toast.component';

import { BaseComponent } from '../base.component';

import { InitiativeService } from '../services/initiative.service';

@Component({
  selector: 'initiatives',
  templateUrl: './initiatives.component.html',
  styleUrls: ['./initiatives.component.scss']
})
export class InitiativesComponent extends BaseComponent implements OnInit {

  initiatives = [];
  isLoading = true;
  isEditing = false;

  public form = new FormGroup({
    _id: new FormControl(''),
    name: new FormControl('', Validators.required),
    start: new FormControl(''),
    end: new FormControl(''),
    color: new FormControl('')
  });

  constructor(
    private initiativeService: InitiativeService,
    private toast: ToastComponent
  ) {
    super(initiativeService);
  }

  ngOnInit() {
    this.getAll();
  }

}
