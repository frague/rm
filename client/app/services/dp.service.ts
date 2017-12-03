import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { BaseService } from './base.service';
import { Observable } from 'rxjs';

@Injectable()
export class DpService extends BaseService {
  private _http: Http;

  constructor(http: Http) {
    super('dp', http);
    this._http = http;
  }

  saveDiff(): Observable<any> {
    return this._http.post('/api/dps', '');
  }
}
