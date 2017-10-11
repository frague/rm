import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ResourceService } from '../services/resource.service';
import { ToastComponent } from '../shared/toast/toast.component';
import { BaseComponent } from '../base.component';


@Component({
  selector: 'people',
  templateUrl: './people.component.html'
})
export class PeopleComponent extends BaseComponent implements OnInit {

  resources = [];
  isLoading = true;
  locations = ['SAR', 'SPB', 'MP', 'KHR', 'LV'];
  pools = ['ML', 'UI'];

  form = new FormGroup({
    _id: new FormControl(''),
    name: new FormControl('', Validators.required),
    login: new FormControl('', Validators.required),
    grade: new FormControl('', Validators.required),
    location: new FormControl('', Validators.required),
    pool: new FormControl('', Validators.required)
  })

  constructor(
    resourceService: ResourceService,
    public toast: ToastComponent
  ) {
    super(resourceService);
  }

  ngOnInit() {
    this.getAll();
  }
}
