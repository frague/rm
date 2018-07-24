import { Component, ViewChild, Input } from '@angular/core';
import { BaseModalComponent } from './base.component';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
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

  show(candidate: any = {}, tabName = '') {
    if (typeof candidate === 'string') {
      this.isLoading = true;
      this.candidateService.getByLogin(candidate)
        .subscribe(candidate => this.candidate = candidate)
        .add(() => this.isLoading = false);
    } else {
      this.candidate = candidate;
    }
    this.open(tabName);
  }
}