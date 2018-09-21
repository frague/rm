import { Component, Input, EventEmitter } from '@angular/core';
import { BaseTabComponent } from './base.component';
import { DomSanitizer } from '@angular/platform-browser';
import { jobViteCandidate } from '../../consts';
import { CandidateService } from '../../services/candidate.service';

@Component({
  selector: 'candidates-tab',
  templateUrl: './candidates-tab.component.html'
})
export class CandidatesTabComponent extends BaseTabComponent {
  @Input() requisitionId: string = '';
  requisitions = [];

  constructor(
    private sanitizer: DomSanitizer,
    private candidateService: CandidateService,
  ) {
    super();
  }

  getCandidates() {
    return (this.requisitions && this.requisitions.length) ? this.requisitions[0].candidates : [];
  }

  fetchData() {
    if (this.requisitionId) {
      this.isLoading = true;
      this.candidateService.getByRequisition(this.requisitionId)
        .subscribe(candidates => this.requisitions = candidates)
        .add(() => this.isLoading = false);
    }
  }

  getJvApplicationLink(candidate) {
    return this.sanitizer.bypassSecurityTrustUrl(jobViteCandidate + candidate.applicationId);
  }
}