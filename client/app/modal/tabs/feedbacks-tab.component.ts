import { Component, Input, EventEmitter } from '@angular/core';
import { from } from 'rxjs';

import { BaseTabComponent } from './base.component';
import { DomSanitizer } from '@angular/platform-browser';
import { PrintableDatePipe } from '../../pipes';
import { InGridService } from '../../services/ingrid.service';

@Component({
  selector: 'feedbacks-tab',
  templateUrl: './feedbacks-tab.component.html'
})
export class FeedbacksTabComponent extends BaseTabComponent {
  @Input() userId: string = '';
  @Input() state: any = {};
  feedbacks = [];
  isAvailable = false;

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
    private ingridService: InGridService,
  ) {
    super();
  }

  deUnder(source: string) {
    return source.replace(/_/g, ' ');
  }

  fetchData() {
    let data = this.getState('feedbacks', this.userId) || null;
    let fetcher = data ? from([data]) : this.ingridService.get(this.userId);

    this.isAvailable = false;

    fetcher
      .subscribe((feedbacks: any) => {
        this.isAvailable = !!feedbacks.available;
        this.feedbacks = this.isAvailable ? feedbacks.feedbacks : [];
        this.setState('feedbacks', this.userId, feedbacks);

        // this.lineChart.labels = labels;
        // this.lineChart.data = [{
        //   label: 'Compensation',
        //   pointRadius: 10,
        //   data: result
        // }];
      });
  }
}