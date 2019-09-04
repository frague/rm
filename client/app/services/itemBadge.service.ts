import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';
import { LoaderService } from './loader.service';

@Injectable()
export class ItemBadgeService extends BaseService {
  private _http: Http;

  constructor(http: Http, loader: LoaderService) {
    super('ib', http, loader);
    this._http = http;
  }

  deleteByIds(itemId, badgeId): Observable<any> {
    return this._http.delete('/api/ib/' + itemId + '/' + badgeId, this.options);
  }
}
