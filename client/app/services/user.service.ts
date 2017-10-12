import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';

import { BaseService } from './base.service';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

@Injectable()
export class UserService extends BaseService {

  httpService: Http;

  constructor(http: Http) {
    super('user', http);
    this.httpService = http;
  }

  register(user): Observable<any> {
    return this.httpService.post('/api/user', JSON.stringify(user), this.options);
  }

  login(credentials): Observable<any> {
    return this.httpService.post('/api/login', JSON.stringify(credentials), this.options);
  }
}
