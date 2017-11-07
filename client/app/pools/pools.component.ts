import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ResourceService } from '../services/resource.service';
import { ToastComponent } from '../shared/toast/toast.component';
import { BaseComponent } from '../base.component';


@Component({
  selector: 'pools',
  templateUrl: './pools.component.html'
})
export class PoolsComponent  {

  items = [];
  locations = ['SAR', 'SPB', 'MP', 'KHR', 'LV'];
  pools = ['ML', 'UI'];

  constructor(
    private resourceService: ResourceService
  ) {
  }

  ngOnInit() {
    this.resourceService.getAll().subscribe(data => this.items = data);
  }
}
