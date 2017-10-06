import { Component, OnInit } from '@angular/core';
import { Http } from '@angular/http';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';

import { ResourceService } from '../services/resource.service';
import { ToastComponent } from '../shared/toast/toast.component';

@Component({
  selector: 'initiatives',
  templateUrl: './initiatives.component.html',
  styleUrls: ['./initiatives.component.scss']
})
export class InitiativesComponent implements OnInit {

  resource = {};
  resources = [];
  isLoading = true;
  isEditing = false;

  addCatForm: FormGroup;
  name = new FormControl('', Validators.required);
  age = new FormControl('', Validators.required);
  weight = new FormControl('', Validators.required);

  constructor(private resourceService: ResourceService,
              private formBuilder: FormBuilder,
              private http: Http,
              public toast: ToastComponent) { }

  ngOnInit() {
    this.getCats();
    this.addCatForm = this.formBuilder.group({
      name: this.name,
      age: this.age,
      weight: this.weight
    });
  }

  getCats() {
    this.resourceService.getAll().subscribe(
      data => this.resources = data,
      error => console.log(error),
      () => this.isLoading = false
    );
  }

  addCat() {
    this.resourceService.add(this.addCatForm.value).subscribe(
      res => {
        const newCat = res.json();
        this.resources.push(newCat);
        this.addCatForm.reset();
        this.toast.setMessage('item added successfully.', 'success');
      },
      error => console.log(error)
    );
  }

  enableEditing(resource) {
    this.isEditing = true;
    this.resource = resource;
  }

  cancelEditing() {
    this.isEditing = false;
    this.resource = {};
    this.toast.setMessage('item editing cancelled.', 'warning');
    // reload the cats to reset the editing
    this.getCats();
  }

  editCat(resource) {
    this.resourceService.edit(resource).subscribe(
      res => {
        this.isEditing = false;
        this.resource = resource;
        this.toast.setMessage('item edited successfully.', 'success');
      },
      error => console.log(error)
    );
  }

  deleteCat(cat) {
    if (window.confirm('Are you sure you want to permanently delete this item?')) {
      this.resourceService.delete(cat).subscribe(
        res => {
          const pos = this.resources.map(elem => elem._id).indexOf(cat._id);
          this.resources.splice(pos, 1);
          this.toast.setMessage('item deleted successfully.', 'success');
        },
        error => console.log(error)
      );
    }
  }

}
