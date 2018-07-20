import { Component, Input, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseTabComponent } from './base.component';
import { DomSanitizer } from '@angular/platform-browser';
import { PrintableDatePipe } from '../../pipes';
import { CarreerService} from '../../services/carreer.service';

@Component({
  selector: 'carreer-tab',
  templateUrl: './carreer-tab.component.html'
})
export class CarreerTabComponent extends BaseTabComponent {
  @Input() bambooId: string = '';
  @Input() state: any = {};
  carreer: any = {};

  public lineChart: any = {
    labels: [''],
    options: {
      responsive: true,
      elements: {
        point: {
          pointStyle: 'rectRot'
        }
      },
      scales: {
        yAxes: [{
          ticks: {
            stepSize: 10000
          }
        }]
      }
    },
    data: [
      {data: [0], label: ''},
    ],
    colors: [
      { // grey
        backgroundColor: 'rgba(148,159,177,0.2)',
        borderColor: 'rgba(148,159,177,1)',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(148,159,177,0.8)'
      },
    ],
    legend: false,
    type: 'line'
  };

  constructor(
    private makeDate: PrintableDatePipe,
    private carreerService: CarreerService,
  ) {
    super();
  }

  fetchData() {
    let data = this.getState('carreer', this.bambooId) || null;
    let fetcher = data ? Observable.from([data]) : this.carreerService.get(this.bambooId);

    this.isLoading = true;
    fetcher
      .subscribe((carreer: any) => {
        this.carreer = carreer;
        this.setState('carreer', this.bambooId, carreer);

        let labels = [];
        let result = (carreer.compensations || [])
          .reverse()
          .map(compensation => {
            labels.push(this.makeDate.transform(compensation.startDate, 'nodate'));
            return Math.round(compensation.rate.value);
          }
        );

        this.lineChart.labels = labels;
        this.lineChart.data = [{
          label: 'Compensation',
          pointRadius: 10,
          data: result
        }];
      })
      .add(() => this.isLoading = false);
  }
}