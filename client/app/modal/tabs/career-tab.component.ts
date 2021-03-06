import { Component, Input, EventEmitter } from '@angular/core';
import { from } from 'rxjs';

import { BaseTabComponent } from './base.component';
import { DomSanitizer } from '@angular/platform-browser';
import { PrintableDatePipe } from '../../pipes';
import { CareerService} from '../../services/career.service';

@Component({
  selector: 'career-tab',
  templateUrl: './career-tab.component.html'
})
export class CareerTabComponent extends BaseTabComponent {
  @Input() bambooId: string = '';
  @Input() state: any = {};
  career: any = {};
  isForbidden = false;

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
    private careerService: CareerService,
  ) {
    super();
  }

  fetchData() {
    let data = this.getState('career', this.bambooId) || null;
    let fetcher = data ? from([data]) : this.careerService.get(this.bambooId);

    this.isForbidden = false;

    fetcher
      .subscribe((career: any) => {
        let jobs = career.jobs;
        if (!jobs || !jobs.length || !jobs[0].date) {
          this.isForbidden = true;
          return;
        }

        this.career = career;
        this.setState('career', this.bambooId, career);

        let labels = [];
        let result = Array.from(career.compensations || [])
          .reverse()
          .map((compensation: any) => {
            labels.push(this.makeDate.transform(compensation.startDate, 'nodate'));
            return compensation.rate ? Math.round(compensation.rate.value) : '-';
          }
        );

        this.lineChart.labels = labels;
        this.lineChart.data = [{
          label: 'Compensation',
          pointRadius: 10,
          data: result
        }];
      });
  }
}