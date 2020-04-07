import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';
import { LoaderService } from './loader.service';

@Injectable()
export class RequisitionDemandService extends BaseService {

  constructor(http: HttpClient, loader: LoaderService) {
    super('rd', http, loader);
  }
}
