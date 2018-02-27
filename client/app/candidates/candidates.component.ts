import { Component, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { CommentsComponent } from '../planner/comments.component';
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
  @ViewChild(CommentsComponent) commentsModal: CommentsComponent;

  items = [];
  requisitionCategories = {};
  requisitionCandidates = {};
  isCategoryFilled = {};
  selectedRequisitionId = null;
  allExpanded = false;

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
    this.items = [];
    this.requisitionCategories = {};
    this.requisitionCandidates = {};
    this.isCategoryFilled = {};

    return this.requisitionService.getAll({}).subscribe(data => {
      this.items = data;
      this.candidateService.getAll(query).subscribe(data => {
        this.allExpanded = data.length <= 100;
        this.requisitionCandidates = data.reduce((result, candidate) => {
          candidate.isHiree = true;
          result[candidate.requisitionId] = result[candidate.requisitionId] || [];
          result[candidate.requisitionId].push(candidate);
          return result;
        }, []);
        this.requisitionCategories = this.items.reduce((result, requisition) => {
          let category = requisition.category;
          if (!result[category]) {
            result[category] = [requisition];
          } else {
            result[category].push(requisition);
          }
          if (!this.isCategoryFilled[category]) {
            this.isCategoryFilled[category] = (this.requisitionCandidates[requisition.requisitionId] || []).length > 0;
          }
          return result;
        }, {});
      });
    })
  }

  getCategories() {
    return Object.keys(this.requisitionCategories).sort();
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

  isRequisitionSelected(requisition) {
    return this.allExpanded || requisition.requisitionId === this.selectedRequisitionId;
  }

  getRequisitionClass(requisition) {
    let isSelected = this.isRequisitionSelected(requisition);
    return {
      'fa-caret-right': !isSelected,
      'fa-caret-down': isSelected
    }
  }

  toggleSelection(requisition) {
    this.selectedRequisitionId = this.isRequisitionSelected(requisition) ? null : requisition.requisitionId;
  }

  getCurrentStatus(candidate: any): string {
    return (candidate && candidate.status) ? candidate.status.text : '';
  }

  showComments(candidate, event: MouseEvent) {
    event.stopPropagation();
    this.commentsModal.show(candidate);
  }

}
