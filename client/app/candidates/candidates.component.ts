import { Component, OnInit, ChangeDetectionStrategy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Subscription, Observable } from 'rxjs';

import { CommentsModal } from '../modal/comments-modal.component';
import { CandidateModal } from '../modal/candidate-modal.component';
import { RequisitionModal } from '../modal/requisition-modal.component';

import { RequisitionService } from '../services/requisition.service';
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
  @ViewChild(CommentsModal) commentsModal: CommentsModal;
  @ViewChild(CandidateModal) candidateModal: CandidateModal;
  @ViewChild(RequisitionModal) requisitionModal: RequisitionModal;

  items = [];
  requisitionsIds = [];
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
    this.requisitionCandidates = {};

    this.isCategoryFilled = {};

    let requisitionsFetcher = this.items.length ? Observable.from([[]]) : this.requisitionService.getAll({});

    return requisitionsFetcher.subscribe(data => {
      if (data.length) {
        this.items = data;
        this.items.push(emptyRequisition);
        this.requisitionsIds = this.items.map(requisition => requisition.requisitionId);
      }

      this.candidateService.getAll(query).subscribe(data => {
        this.allExpanded = data.length <= 100;

        // Group candidates by requisition
        this.requisitionCandidates = data.reduce((result, candidate) => {
          candidate.isHiree = true;
          if (!this.requisitionsIds.includes(candidate.requisitionId)) {
            candidate.requisitionId = emptyRequisition.requisitionId;
          }
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
        this.cd.markForCheck();
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

  showModal(candidate, event: MouseEvent, tabName='') {
    event.stopPropagation();
    this.candidateModal.show(candidate, tabName);
  }

  showRequisition(requisition, event: MouseEvent) {
    event.stopPropagation();
    this.requisitionModal.show(requisition);
  }
}
