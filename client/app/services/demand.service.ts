import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { BaseService } from './base.service';
import { LoaderService } from './loader.service';


@Injectable()
export class DemandService extends BaseService {
  constructor(http: Http, loader: LoaderService) {
    super('demand', http, loader);
  }
}
