import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseService } from './base.service';
import { Observable } from 'rxjs';
import { LoaderService } from './loader.service';

const entity = 'requisition';

@Injectable()
export class RequisitionService extends BaseService {

  constructor(http: HttpClient, loader: LoaderService) {
    super(entity, http, loader);
  }
}
