import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastComponent } from '../shared/toast/toast.component';
import { Subscription } from 'rxjs';

import { RequisitionService } from '../services/requisition.service';
import { CandidateService } from '../services/candidate.service';
import { BusService } from '../services/bus.service';

@Component({
  selector: 'candidates',
  templateUrl: './candidates.component.html'
})
export class CandidatesComponent implements OnInit {
  items = [];
  requisitionCandidates = {};
  private $query;

  constructor(
    private requisitionService: RequisitionService,
    private candidateService: CandidateService,
    private bus: BusService
  ) {
  }

  ngOnInit() {
    this.fetchData();
    this.$query = this.bus.filterUpdated.subscribe(query => this.fetchData(query));
    this.fetchData(this.bus.filterQuery);
  }

  ngOnDestroy() {
    this.$query.unsubscribe();
  }

  fetchData(query={}): Subscription {
    return this.requisitionService.getAll(query).subscribe(data => {
      this.items = data;
      this.candidateService.getAll().subscribe(data => {
        this.requisitionCandidates = data.reduce((result, candidate) => {
          result[candidate.requisitionId] = result[candidate.requisitionId] || [];
          result[candidate.requisitionId].push(candidate);
          return result;
        });
      });
    })
  }

  getRequisitions() {
    return this.items;
  }
}
