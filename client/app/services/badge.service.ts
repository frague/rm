import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseService } from './base.service';

const entity = 'badge';

@Injectable()
export class BadgeService extends BaseService {
  private _http: Http;

  constructor(http: Http) {
    super(entity, http);
    this._http = http;
  }

  getAllFor(itemId): Observable<any> {
    return this._http.get('/api/' + entity + 's/' + itemId).pipe(map(res => res.json()));
  }
}
