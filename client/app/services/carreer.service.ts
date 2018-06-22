import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { BaseService } from './base.service';
import { Observable } from 'rxjs';

@Injectable()
export class CarreerService extends BaseService {

  constructor(http: Http) {
    super('carreer', http);
  }

  get(bambooId: string): Observable<any> {
    return super.get({_id: bambooId});
  }
}
