import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';
import { LoaderService } from './loader.service';

@Injectable()
export class RequisitionDemandService extends BaseService {

  constructor(http: Http, loader: LoaderService) {
    super('rd', http, loader);
  }
}
