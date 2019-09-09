import { Component, Input, Output, EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { BusService } from '../services/bus.service';
import { CacheService } from '../services/cache.service';
import { DemandPlanService } from '../services/demandplan.service';

@Component({
  selector: 'demand-plan',
  templateUrl: './demandplan.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DemandPlanComponent {
  @Input() rowsLogins = {};
  @Output() planHasChanged = new EventEmitter();

  query = {};
  criteria = '';
  selectedPlan: any = {};
  plans = {};
  title = '';

  constructor(
    private bus: BusService,
    private demandPlans: DemandPlanService,
    private cache: CacheService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    (this.cache.getObservable('plans') || this.demandPlans.getAll()).subscribe(data => {
      this.cache.set('plans', data);

      let criteria = this.bus.criteria;
      let selectedPlan = null;
      this.plans = data.reduce((result, plan) => {
          result[plan._id] = plan;
          if (criteria === plan.filter) {
            selectedPlan = plan;
          }
          return result;
        }, {});
      if (selectedPlan) {
        this.select(selectedPlan, false);
      } else {
        this.cd.markForCheck();
      }
    });
  }

  getPlans() {
    return Object.values(this.plans);
  }

  save() {
    let pairs = Object.keys(this.rowsLogins).reduce((result, key) => {
      result[0].push(key);
      result[1].push(this.rowsLogins[key]);
      return result;
    }, [[], []]);
    let newPlan = {
      date: this.selectedPlan._id ? new Date(this.selectedPlan.date) : new Date(),
      title: this.title,
      filter: this.bus.criteria,
      rows: pairs[0],
      logins: pairs[1]
    };
    let operation = this.selectedPlan._id ?
      this.demandPlans.edit(Object.assign(this.selectedPlan, newPlan)) :
      this.demandPlans.add(newPlan);

    operation.subscribe(data => {
      this.plans[data._id] = data;
      this.select(data, false);
      this.cache.reset('plans');
    });
  }

  delete() {
    this.demandPlans.delete(this.selectedPlan).subscribe(() => {
      delete this.plans[this.selectedPlan._id];
      this.reset();
      this.cache.reset('plans');
    });
  }

  select(plan, updateCriteria=true) {
    this.selectedPlan = plan;
    this.title = plan.title;
    if (updateCriteria) {
      this.bus.criteriaUpdated.emit(plan.filter);
    }
    this.planHasChanged.emit({rows: plan.rows, logins: plan.logins});
    this.cd.markForCheck();
  }

  reset() {
    this.title = '';
    this.selectedPlan = {};
    this.cd.markForCheck();
  }
}