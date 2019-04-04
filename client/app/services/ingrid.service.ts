import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { BaseService } from './base.service';
import { Observable } from 'rxjs';

@Injectable()
export class InGridService extends BaseService {

  constructor(http: Http) {
    super('ingrid', http);
  }

  get(login: string): Observable<any> {
    return super.get({_id: login});
  }

  getOrdinance(login: string): Observable<any> {
    return this.get(login + '/ordinance');
  }
}
