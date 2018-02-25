import { Component, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { RequisitionService } from '../services/requisition.service';
import { CandidateService } from '../services/candidate.service';
import { BusService } from '../services/bus.service';

const jobViteCandidate = 'https://app.jobvite.com/jhire/modules/candidates/details.html?applicationId=';
const jobViteRequisition = 'https://app.jobvite.com/jhire/modules/requisitions/tabs.html#/summary/';

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
    private sanitizer: DomSanitizer,
    private bus: BusService
  ) {
  }

  ngOnInit() {
    this.$query = this.bus.filterUpdated.subscribe(query => this.fetchData(query));
    this.fetchData(this.bus.filterQuery);
  }

  ngOnDestroy() {
    this.$query.unsubscribe();
  }

  fetchData(query={}): Subscription {
    return this.requisitionService.getAll({}).subscribe(data => {
      this.items = data;
      this.candidateService.getAll(query).subscribe(data => {
        this.requisitionCandidates = data.reduce((result, candidate) => {
          result[candidate.requisitionId] = result[candidate.requisitionId] || [];
          result[candidate.requisitionId].push(candidate);
          return result;
        }, []);
      });
    })
  }

  getRequisitions() {
    return this.items;
  }

  getJvRequisitionLink(requisition) {
    return this.sanitizer.bypassSecurityTrustUrl(jobViteRequisition + requisition.eId);
  }

  getJvCandidateLink(candidate) {
    return this.sanitizer.bypassSecurityTrustUrl(jobViteCandidate + candidate.applicationId);
  }

}
