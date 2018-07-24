import { Component, Input } from '@angular/core';
import { BaseTabComponent } from './base.component';
import { DomSanitizer } from '@angular/platform-browser';
import { jobViteCandidate } from '../../consts';

@Component({
  selector: 'candidate-tab',
  templateUrl: './candidate-tab.component.html'
})
export class CandidateTabComponent extends BaseTabComponent {
  @Input() candidate: any = {};

  constructor(
    private sanitizer: DomSanitizer,
  ) {
    super();
  }

  getJvApplicationLink(candidate) {
    return this.sanitizer.bypassSecurityTrustUrl(jobViteCandidate + candidate.applicationId);
  }
}