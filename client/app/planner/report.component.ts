import { Component, ViewChild, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'report-modal',
  templateUrl: './report.component.html'
})
export class ReportComponent {
  @ViewChild('content') content;
  @Input() accountsDemand: any[] = [];
  @Input() candidates: any[] = [];

  matches: any = {};
  candidatesByLogin: any = {};

  isPrintable = false;

  stages = {
    SP: 'sales prospect',
    VA: 'verbally agreed',
    FC: 'fully confirmed',
  };

  constructor(private modalService: NgbModal) {}

  updateCandidates() {
    this.candidatesByLogin = this.candidates.reduce((result, candidate) => {
      result[candidate.login] = candidate;
      return result;
    }, {});
  }

  getAccounts() {
    return Object.keys(this.accountsDemand).sort();
  }

  getAccountDemand(account: string): any[] {
    return this.accountsDemand[account] || [];
  }

  injectDemandCandidates() {
    this.getAccounts().forEach(account => this.getAccountDemand(account).forEach(demand => {
      let candidate = this.candidatesByLogin[this.matches[demand.login]] || {};
      demand.combinedStatus = this.combineStatus(demand, candidate);
      demand.candidate = candidate;
    }));
  }

  combineStatus(demand: any={}, candidate: any={}) {
    return [demand.status, candidate.status].reduce((result, source) => {
      if (source && source.text) result.push((source.source ? `###### ${source.source}\n` : '') + source.text);
      return result;
    }, []).join('\n\n');
  }

  show(matches: any) {
    this.matches = matches;
    this.updateCandidates();
    this.injectDemandCandidates();
    this.modalService.open(this.content, {size: 'lg'});
  }

  setPrintable(state: boolean) {
    this.isPrintable = state;
  }

  getDemandTitle(demand): string {
    return demand.name.replace(/ /, ` ${demand.grades} `);
  }
}