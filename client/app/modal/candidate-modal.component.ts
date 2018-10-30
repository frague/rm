import { Component, ViewChild, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { BaseModalComponent } from './base.component';
import { CandidateService } from '../services/candidate.service';

@Component({
  selector: 'candidate-modal',
  templateUrl: './candidate-modal.component.html'
})
export class CandidateModal extends BaseModalComponent {
  isLarge = true;
  @ViewChild('content') content;
  candidate: any = {};

  constructor(
    modalService: NgbModal,
    private candidateService: CandidateService,
  ) {
    super(modalService);
  }

  adaptCandidate(candidate: any) {
    candidate.state = (candidate.state || '').replace(/^\d+ /, '');
    return candidate;
  }

  show(candidate: any = {}, tabName = ''): Subject<any> {
    this.candidate = {};
    if (typeof candidate === 'string') {
      this.isLoading = true;
      this.candidateService.getByLogin(candidate)
        .subscribe(candidate => {
          this.candidate = this.adaptCandidate(candidate);
        })
        .add(() => this.isLoading = false);
    } else {
      this.candidate = this.adaptCandidate(candidate);
    }
    return this.open(tabName);
  }
}