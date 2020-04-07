import { Component, OnInit, ChangeDetectionStrategy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Subscription, Observable } from 'rxjs';

import { CandidateModal } from '../modal/candidate-modal.component';
import { RequisitionModal } from '../modal/requisition-modal.component';
import { DemandModal } from '../modal/demand-modal.component';

import { RequisitionService } from '../services/requisition.service';
import { CacheService } from '../services/cache.service';
import { BusService } from '../services/bus.service';

import { jobViteRequisition, jobViteCandidate } from '../consts';

const emptyRequisition = {
  title: 'Filled, Closed, Cancelled, etc.',
  category: ' Everything else',
  requisitionId: ''
};

const closedStates = ['Filled', 'Closed', 'Cancelled', 'On hold'];
const states = {
  true: 'Active',
  false: 'Inactive'
};

@Component({
  selector: 'candidates',
  templateUrl: './candidates.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CandidatesComponent implements OnInit {
  @ViewChild(CandidateModal, { static: true }) candidateModal: CandidateModal;
  @ViewChild(RequisitionModal, { static: true }) requisitionModal: RequisitionModal;
  @ViewChild(DemandModal, { static: true }) demandModal: DemandModal;

  items = [];
  requisitionsIds = [];
  categoryRequisitions = {};
  requisitionCandidates = {};
  isCategoryFilled = {};
  selectedRequisitionId = null;
  allExpanded = false;

  private $query;

  constructor(
    private requisitionService: RequisitionService,
    private sanitizer: DomSanitizer,
    private bus: BusService,
    private cache: CacheService,
    private cd: ChangeDetectorRef
  ) {
  }

  ngOnInit() {
    this.$query = this.bus.filterUpdated.subscribe(([query, serviceData]) => {
      this.cache.reset(['requisitions']);
      this.fetchData(query, serviceData);
    });
    this.fetchData(this.bus.filterQuery, this.bus.serviceData);
  }

  ngOnDestroy() {
    this.$query.unsubscribe();
  }

  private _compare(demand, requisition): string {
    let result = [];

    // Set of locations differs
    let [d, r] = [
      demand.locations.sort().join(', '),
      requisition.location
    ];
    if (d !== r) {
      result.push(`Locations: requisition - ${r}, demand - ${d}`);
    }

    // Equally open or closed (filled)
    [d, r] = [!!demand.login, !closedStates.includes(requisition.jobState)];
    if (d !== r) {
      result.push(`States: requisition - ${states[r]}, demand - ${states[d]}`);
    }
    return result.join('\n');
  }

  fetchData(query: any={}, serviceData={}): Subscription {
    this.allExpanded = false;
    this.cd.markForCheck();

    if (!query || !query.or || !query.or.length) {
      this.cache.set('requisitions', []);
    }

    let order = serviceData['order'];
    let requisitionsQuery = this.cache.getObservable('requisitions') || this.requisitionService.getAll({...query, order});

    return requisitionsQuery.subscribe(data => {
      this.cache.set('requisitions', data);

      this.allExpanded = data && data.length <= 10;

      this.categoryRequisitions = data.reduce((result, requisition) => {
        let category = requisition.category;
        if (!result[category]) {
          result[category] = [requisition];
        } else {
          result[category].push(requisition);
        }
        if (requisition.demands) {
          requisition.demands.forEach(demand => demand.comparison = this._compare(demand, requisition));
        }
        return result;
      }, {});

      this.items = data;
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

  getCurrentStatus(entity: any): string {
    return (entity && entity.status) ? entity.status.text : '';
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

  showRequisition(requisition, showComments=false) {
    event.stopPropagation();
    this.requisitionModal.show(requisition, showComments && 'comments')
      .subscribe(({status, commentsCount}) => {
        [requisition.status, requisition.commentsCount] = [status, commentsCount];
        this.cd.markForCheck();
      });
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
      'Hold': 'fa-pause',
      'Awaiting Approval': 'fa-clock-o'
    }[requisition.jobState];
  }

  showDemand(demand, diff) {
    if (demand.id) {
      this.demandModal.show(demand.id, demand.comparison ? 'discrepancies' : '', demand.comparison);
    }
  }
}
