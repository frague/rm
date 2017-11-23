import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { BaseService } from './base.service';

@Injectable()
export class DemandPlanService extends BaseService {

  constructor(http: Http) {
    super('plan', http);
  }
}
