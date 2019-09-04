import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { BaseService } from './base.service';
import { Observable } from 'rxjs';
import { LoaderService } from './loader.service';

const entity = 'requisition';

@Injectable()
export class RequisitionService extends BaseService {

  constructor(http: Http, loader: LoaderService) {
    super(entity, http, loader);
  }
}
