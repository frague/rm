import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastComponent } from '../shared/toast/toast.component';
import { Subscription } from 'rxjs';

import { RequisitionService } from '../services/requisition.service';
import { BusService } from '../services/bus.service';

@Component({
  selector: 'candidates',
  templateUrl: './candidates.component.html'
})
export class CandidatesComponent implements OnInit {
  items = [];
  requisitions = {};

  constructor(
    private requisitionService: RequisitionService,
    bus: BusService
  ) {
  }

  ngOnInit() {
    this.fetchData();
  }

  fetchData(query={}): Subscription {
    return this.requisitionService.getAll(query).subscribe(data => {
      this.items = data;
    })
  }

  getRequisitions() {
    return this.items;
  }

}
