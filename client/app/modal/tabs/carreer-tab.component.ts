import { Component, Input, EventEmitter } from '@angular/core';
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
    if (!this.isCarreerFetched()) {
      this.isLoading = true;
      this.carreerService.get(this.bambooId)
        .subscribe(carreer => {
          this.carreer = carreer;
          let labels = [];
          let result = (carreer.compensations || [])
            .reverse()
            .map(compensation => {
              labels.push(this.makeDate.transform(compensation.startDate, 'nodate'));
              return Math.round(compensation.rate.value);
            }
          );

          // if (result.length == 1) {
          //   labels.push(datePipe.transform(new Date(), true));
          //   result.push(result[0]);
          // };

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

  isCarreerFetched(): boolean {
    return Object.keys(this.carreer).length > 0;
  }

}