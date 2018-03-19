import { Component, ViewChild, Input } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

const emptyCandidate = new Array(4).join('-').split('-');

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

  combineStatus(demand: any={}, candidate: any={}) {
    return [demand.status, candidate.status].reduce((result, source) => {
      if (source && source.text) result.push(source.text);
      return result;
    }, []).join('\n\n');
  }

  getCandidate(demand: any) {
    let candidate = this.candidatesByLogin[this.matches[demand.login]];
    let demandCandidate = candidate ?
      [
        candidate.name,
        candidate.grade,
        candidate.location,
        candidate.canTravel ? '+' : ''
      ]
    :
      [].concat(emptyCandidate);
    demandCandidate.push(this.combineStatus(demand, candidate));
    return demandCandidate;
  }

  getDetails(demand) {
    demand = demand || {deployment: '', grades: ''};
    let grades = demand.grades;
    let deployment = demand.deployment.toLowerCase().indexOf('onsite') >= 0 ? 'onsite' : '';
    if (grades  || deployment) {
      return ' (' +  (grades && grades) + (grades && deployment ? ', ' : '') + (deployment && deployment) + ')';
    }
    return '';
  }

  show(matches: any) {
    this.matches = matches;
    this.updateCandidates();
    this.modalService.open(this.content, {size: 'lg'});
  }
}