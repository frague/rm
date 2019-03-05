import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { BaseService } from './base.service';
import { Observable } from 'rxjs';

@Injectable()
export class CareerService extends BaseService {

  constructor(http: Http) {
    super('career', http);
  }

  get(bambooId: string): Observable<any> {
    return super.get({_id: bambooId});
  }
}
