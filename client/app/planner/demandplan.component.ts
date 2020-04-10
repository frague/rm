import { Component, Input, Output, EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { BusService } from '../services/bus.service';
import { CacheService } from '../services/cache.service';
import { DemandPlanService } from '../services/demandplan.service';
import { Router, ActivatedRoute } from '@angular/router';

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

  $paramsChange;
  private _routePlanId = null;

  constructor(
    private bus: BusService,
    private demandPlans: DemandPlanService,
    private cache: CacheService,
    private cd: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
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
      } if (this._routePlanId) {
        this.select(this.plans[this._routePlanId], true);
        this._routePlanId = null;
      } else {
        this.cd.markForCheck();
      }
    });

    this.$paramsChange = this.route.queryParams
      .subscribe(params => {
        this._routeToPlan(params['plan'])
      }
    );
  }

  OnDestroy() {
    this.$paramsChange.unsubscribe();
  }

  private _routeToPlan(planId: string) {
    // console.log('Switching to', planId);
    this._routePlanId = planId;

    let newSelection = this.plans[planId];
    if (newSelection && newSelection !== this.selectedPlan) {
      this.select(newSelection);
    }
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

  select(plan, updateCriteria=true): void {
    if (!plan) return;

    this.selectedPlan = plan;
    this.title = plan.title;
    if (updateCriteria) {
      this.bus.criteriaUpdated.emit(plan.filter);
    }
    this.planHasChanged.emit({rows: plan.rows, logins: plan.logins});
    this.router.navigate([], {queryParams: {plan: plan._id}});
    this.cd.markForCheck();
  }

  reset(): void {
    this.title = '';
    this.selectedPlan = {};
    this.cd.markForCheck();
  }
}