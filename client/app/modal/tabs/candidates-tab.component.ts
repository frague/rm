import { Component, Input, EventEmitter } from '@angular/core';
import { BaseTabComponent } from './base.component';
import { DomSanitizer } from '@angular/platform-browser';
import { jobViteRequisition } from '../../consts';
import { CandidateService } from '../../services/candidate.service';

@Component({
  selector: 'candidates-tab',
  templateUrl: './candidates-tab.component.html'
})
export class CandidatesTabComponent extends BaseTabComponent {
  @Input() requisitionId: string = '';
  candidates = [];

  constructor(
    private sanitizer: DomSanitizer,
    private candidateService: CandidateService,
  ) {
    super();
  }

  fetchData() {
    if (this.requisitionId) {
      this.isLoading = true;
      this.candidateService.getByRequisition(this.requisitionId)
        .subscribe(candidates => this.candidates = candidates)
        .add(() => this.isLoading = false);
    }
  }

  getJvcandidatesLink(candidate) {
    return this.sanitizer.bypassSecurityTrustUrl(jobViteRequisition + candidate.applicationId);
  }
}