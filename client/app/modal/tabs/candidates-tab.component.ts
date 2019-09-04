import { Component, Input, EventEmitter } from '@angular/core';
import { BaseTabComponent } from './base.component';
import { DomSanitizer } from '@angular/platform-browser';
import { jobViteCandidate } from '../../consts';
import { CandidateService } from '../../services/candidate.service';
import { Utils } from '../../utils';

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
      this.candidateService.getByRequisition(this.requisitionId)
        .subscribe(candidates => this.candidates = candidates);
    }
  }

  getJvApplicationLink(candidate) {
    return this.sanitizer.bypassSecurityTrustUrl(jobViteCandidate + candidate.applicationId);
  }

  cleanupStatus(status: string): string {
    return Utils.cleanupJvStatus(status);
  }
}