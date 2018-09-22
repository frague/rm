import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { DemandModal } from '../modal/demand-modal.component';

@Component({
  selector: 'demands',
  templateUrl: './requisition-demand.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RequisitionDemandComponent {
  @Input() demands: any;
  @Output() showDemand: EventEmitter<string> = new EventEmitter();

  getDemandStyle(demand) {
    let problem = !!demand.comparison;
    return  { problem };
  }
  
  getId(demand) {
    let id = demand.id || '';
    [id, ] = id.split('_');
    return id;
  }

  showDemandModal(demand) {
    this.showDemand.emit(demand);
  }
}