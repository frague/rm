import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs';

import { BaseService } from './base.service';
import { LoaderService } from './loader.service';


@Injectable()
export class UserService extends BaseService {

  private _http: Http;

  constructor(http: Http, loader: LoaderService) {
    super('user', http, loader);
    this._http = http;
  }

  register(user): Observable<any> {
    return this._http.post('/api/user', JSON.stringify(user), this.options);
  }

  login(credentials): Observable<any> {
    return this._http.post('/api/login', JSON.stringify(credentials), this.options);
  }
}
