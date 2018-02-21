import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastComponent } from '../shared/toast/toast.component';

import { DemandService } from '../services/demand.service';
import { BusService } from '../services/bus.service';

@Component({
  selector: 'candidates',
  templateUrl: './candidates.component.html'
})
export class CandidatesComponent {
  constructor(
    demandService: DemandService,
    bus: BusService
  ) {
  }

}
