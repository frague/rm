import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';


@Injectable()
export class DemandService extends BaseService {

  _http: Http;

  constructor(http: Http) {
    super('demand', http);
    this._http = http;
  }

  import(): Observable<any> {
    return this._http.get('/api/demands/import').map(res => res.json());
  }

}
