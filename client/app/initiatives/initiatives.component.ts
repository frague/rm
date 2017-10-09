import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { InitiativeService } from '../services/initiative.service';
import { ToastComponent } from '../shared/toast/toast.component';

@Component({
  selector: 'initiatives',
  templateUrl: './initiatives.component.html',
  styleUrls: ['./initiatives.component.scss']
})
export class InitiativesComponent implements OnInit {

  initiative = {};
  initiatives = [];
  isLoading = true;
  isEditing = false;

  addInitiativeForm = new FormGroup({
    name: new FormControl('', Validators.required),
    start: new FormControl(''),
    end: new FormControl('')
  });

  constructor(
    private initiativeService: InitiativeService,
    public toast: ToastComponent
  ) { }

  ngOnInit() {
    this.getInitiatives();
  }

  getInitiatives() {
    this.initiativeService.getAll().subscribe(
      data => this.initiatives = data,
      error => console.log(error),
      () => this.isLoading = false
    );
  }

  addInitiative() {
    this.initiativeService.add(this.addInitiativeForm.value).subscribe(
      res => {
        const newInitiative = res.json();
        this.initiatives.push(newInitiative);
        this.addInitiativeForm.reset();
        this.toast.setMessage('item added successfully.', 'success');
      },
      error => console.log(error)
    );
  }

  enableEditing(initiative) {
    this.isEditing = true;
    this.initiative = initiative;
  }

  cancelEditing() {
    this.isEditing = false;
    this.initiative = {};
    this.toast.setMessage('item editing cancelled.', 'warning');
    // reload the Initiatives to reset the editing
    this.getInitiatives();
  }

  editInitiative(initiative) {
    this.initiativeService.edit(initiative).subscribe(
      res => {
        this.isEditing = false;
        this.initiative = initiative;
        this.toast.setMessage('item edited successfully.', 'success');
      },
      error => console.log(error)
    );
  }

  deleteInitiative(initiative) {
    if (window.confirm('Are you sure you want to permanently delete this item?')) {
      this.initiativeService.delete(initiative).subscribe(
        res => {
          const pos = this.initiatives.map(elem => elem._id).indexOf(initiative._id);
          this.initiatives.splice(pos, 1);
          this.toast.setMessage('item deleted successfully.', 'success');
        },
        error => console.log(error)
      );
    }
  }

}
