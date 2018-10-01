import { Component, Output, EventEmitter, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BaseComponent } from '../base.component';
import { DpService } from '../services/dp.service';
import { PrintableDatePipe } from '../pipes';
import { Subscription, Observable } from 'rxjs';

import { DemandModal } from '../modal/demand-modal.component';
import { RequisitionModal } from '../modal/requisition-modal.component';
import { PersonModal } from '../modal/person-modal.component';
import { CandidateModal } from '../modal/candidate-modal.component';

const rowNumber = /^\d+$:/g;

@Component({
  selector: 'deadpool',
  templateUrl: './dp.component.html'
})
export class DpComponent extends BaseComponent {
  @ViewChild(DemandModal) demandModal: DemandModal;
  @ViewChild(RequisitionModal) requisitionModal: RequisitionModal;
  @ViewChild(PersonModal) personModal: PersonModal;
  @ViewChild(CandidateModal) candidateModal: CandidateModal;

  public form = new FormGroup({});
  types = ['r', 'd', 'c'];

  typeNames = {r: 'Employees', d: 'Demands', c: 'Candidates'};
  diffs = {};

  constructor(
    private makeDate: PrintableDatePipe,
    private dp: DpService
  ) {
    super(dp);
    this.reset();
  }

  reset() {
    this.diffs = this.types.reduce((result, type) => {
      result[type] = {};
      return result
    }, {});
  }

  getAll(criteria: any = {}): Subscription {
    this.reset();
    return Observable.forkJoin(this.types.map(type => {
      let query = Object.assign({type}, criteria);
      return this.dp.getAll(query);
    })).subscribe(
      diffs => {
        [].concat(...diffs).forEach(diff => {
          let key = this.makeDate.transform(diff.date);
          let byType = this.diffs[diff.type];
          if (!byType[key]) {
            byType[key] = [];
          }
          byType[key].push(diff);

        });
      },
      error => console.log(error)
    );
  }

  getDatesFor(type: string) {
    return Object.keys(this.diffs[type]);
  }

  makeReq(id: string) {
    let [requisitionId = '', name = '', eId = ''] = id.split('-');
    return requisitionId;
  }

  makeDemandCaption(id: string) {
    let account = id.replace(/^\d+[:_]/g, '').replace(/_/g, ' ');
    let row = id.substr(0, id.length - account.length - 1);
    return '#' + row + '. ' + account.replace('for ', '@');
  }

  showDemand(diff: any) {
    if (diff.diff !== -1) {
      this.demandModal.show(diff.subject);
    }
  }

  showRequisition(diff: any) {
    if (diff.diff !== -1) {
      let reqId = this.makeReq(diff.subject);
      if (reqId) {
        this.requisitionModal.show(reqId);
      }
    }
  }

  showPerson(diff: any) {
    if (diff.diff !== -1) {
      this.personModal.show(diff.subject);
    }
  }

  showCandidate(diff: any) {
    if (diff.diff !== -1) {
      this.candidateModal.show(diff.subject);
    }
  }

  hasDiff(diff: any) {
    return diff.diff !== 1 && diff.diff !== -1;
  }

  isNewcomer(subject: string) {
    return subject.indexOf(' ') >= 0;
  }
}