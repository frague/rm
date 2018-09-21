import { Component, OnInit, ChangeDetectionStrategy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Subscription, Observable } from 'rxjs';

import { CandidateModal } from '../modal/candidate-modal.component';
import { RequisitionModal } from '../modal/requisition-modal.component';
import { DemandModal } from '../modal/demand-modal.component';

import { CandidateService } from '../services/candidate.service';
import { BusService } from '../services/bus.service';

import { jobViteRequisition, jobViteCandidate } from '../consts';

const emptyRequisition = {
  title: 'Filled, Closed, Cancelled, etc.',
  category: ' Everything else',
  requisitionId: ''
};

@Component({
  selector: 'candidates',
  templateUrl: './candidates.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CandidatesComponent implements OnInit {
  @ViewChild(CandidateModal) candidateModal: CandidateModal;
  @ViewChild(RequisitionModal) requisitionModal: RequisitionModal;
  @ViewChild(DemandModal) demandModal: DemandModal;

  items = [];
  requisitionsIds = [];
  categoryRequisitions = {};
  requisitionCandidates = {};
  isCategoryFilled = {};
  selectedRequisitionId = null;
  allExpanded = false;

  private $query;

  constructor(
    private candidateService: CandidateService,
    private sanitizer: DomSanitizer,
    private bus: BusService,
    private cd: ChangeDetectorRef
  ) {
  }

  ngOnInit() {
    this.$query = this.bus.filterUpdated.subscribe(([query]) => this.fetchData(query));
    this.fetchData(this.bus.filterQuery);
  }

  ngOnDestroy() {
    this.$query.unsubscribe();
  }

  fetchData(query={}): Subscription {
    this.allExpanded = false;

    return this.candidateService.getAll(query).subscribe(data => {
        this.items = data;
        this.allExpanded = data && data.length <= 10;

        this.categoryRequisitions = this.items.reduce((result, requisition) => {
          let category = requisition.category;
          if (!result[category]) {
            result[category] = [requisition];
          } else {
            result[category].push(requisition);
          }
          return result;
        }, {});
        this.cd.markForCheck();
      });
  }

  getCategories() {
    return Object.keys(this.categoryRequisitions).sort();
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
    let isEmpty = !requisition.candidates || !requisition.candidates.length;
    return !isEmpty && (this.allExpanded || requisition.requisitionId === this.selectedRequisitionId);
  }

  getRequisitionClass(requisition) {
    let isSelected = this.isRequisitionSelected(requisition);
    let isEmpty = !requisition.candidates || !requisition.candidates.length;
    if (isEmpty) {
      return '';
    }
    return {
      'fa-caret-right': !isSelected,
      'fa-caret-down': isSelected
    }
  }

  getStateClass(state) {
    return {
      'Filled': 'fa-check',
      'Draft': 'fa-pencil',
      'Open': 'fa-search',
    }[state];
  }

  getRequisitionDetails(requisition): string {
    if (!requisition) {
      return '';
    }
    return [
      requisition.department,
      requisition.location,
      requisition.internalOnly ? 'Internal Only' : 'Internal/External'
    ].filter(item => !!item).join(', ');
  }

  toggleSelection(requisition) {
    this.selectedRequisitionId = this.isRequisitionSelected(requisition) ? null : requisition.requisitionId;
    this.cd.markForCheck();
  }

  getCurrentStatus(candidate: any): string {
    return (candidate && candidate.status) ? candidate.status.text : '';
  }

  showCandidate(candidate, showComments=false, event: MouseEvent = null) {
    if (event) {
      event.stopPropagation();
    }
    this.candidateModal.show(candidate, showComments && 'comments')
      .subscribe(({status, commentsCount}) => {
        [candidate.status, candidate.commentsCount] = [status, commentsCount];
        this.cd.markForCheck();
      });
  }

  showRequisition(requisition, event: MouseEvent) {
    event.stopPropagation();
    this.requisitionModal.show(requisition);
  }

  getRequisitionClasses(requisition) {
    return {
      'selected': this.isRequisitionSelected(requisition),
    };
  }

  getStatusStyle(requisition) {
    return {
      'Filled': 'fa-check',
      'Open': 'fa-search',
      'Draft': 'fa-pencil',
      'Hold': 'fa-clock-o',
      'Awaiting Approval': 'fa-hourglass-2'
    }[requisition.jobState];
  }

  getDemandStyle(requisition, demand) {
    let l = demand.locations.join(', ');
    let alert = l !== requisition.location;
    return  {
      'fa-exclamation-triangle': alert && demand.login,
      'fa-id-card': !alert,
      'fa-times': !demand.login
     };
  }

  showDemand(demand) {
    if (demand.id) {
      this.demandModal.show(demand.id);
    }
  }
}
