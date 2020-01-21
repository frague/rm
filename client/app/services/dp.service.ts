import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { BaseService } from './base.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LoaderService } from './loader.service';

@Injectable()
export class DpService extends BaseService {
  private _http: Http;

  constructor(http: Http, loader: LoaderService) {
    super('dp', http, loader);
    this._http = http;
  }

  saveDiff(): Observable<any> {
    return this._http.post('/api/dps', '');
  }

  getUpdateDate(): Observable<any> {
    return this._http.get('/api/updated').pipe(map(res => res.json()));
  }
}
