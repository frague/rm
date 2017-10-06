import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ResourceService } from '../services/resource.service';
import { ToastComponent } from '../shared/toast/toast.component';


@Component({
  selector: 'assignments',
  templateUrl: './assignments.component.html',
  styleUrls: ['./assignments.component.scss']
})
export class AssignmentsComponent implements OnInit {

  resource = {};
  resources = [];
  isLoading = true;
  locations = ['SAR', 'SPB', 'MP', 'KHR', 'LV'];
  pools = ['ML', 'UI'];

  addResourceForm = new FormGroup({
    name: new FormControl('', Validators.required),
    login: new FormControl('', Validators.required),
    grade: new FormControl('', Validators.required),
    location: new FormControl('', Validators.required),
    pool: new FormControl('', Validators.required)
  })

  constructor(
    private resourceService: ResourceService,
    public toast: ToastComponent
  ) { }

  ngOnInit() {
    this.getResources();
  }

  getResources() {
    this.resourceService.getAll().subscribe(
      data => this.resources = data,
      error => console.log(error),
      () => this.isLoading = false
    );
  }  addResource() {
    this.resourceService.add(this.addResourceForm.value).subscribe(
      res => {
        const newResource = res.json();
        this.resources.push(newResource);
        this.addResourceForm.reset();
        this.toast.setMessage('item added successfully.', 'success');
      },
      error => console.log(error)
    );
  }
}
