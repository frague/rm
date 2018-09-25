import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { BaseService } from './base.service';
import { Observable } from 'rxjs';

const entity = 'requisition';

@Injectable()
export class RequisitionService extends BaseService {

  constructor(http: Http) {
    super(entity, http);
  }
}
