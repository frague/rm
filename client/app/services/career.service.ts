import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseService } from './base.service';
import { Observable } from 'rxjs';
import { LoaderService } from './loader.service';

@Injectable()
export class CareerService extends BaseService {

  constructor(http: HttpClient, loader: LoaderService) {
    super('career', http, loader);
  }

  get(bambooId: string): Observable<any> {
    return super.get({_id: bambooId});
  }
}
