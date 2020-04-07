import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';
import { LoaderService } from './loader.service';

@Injectable()
export class ItemBadgeService extends BaseService {
  private _http: HttpClient;

  constructor(http: HttpClient, loader: LoaderService) {
    super('ib', http, loader);
    this._http = http;
  }

  deleteByIds(itemId, badgeId): Observable<any> {
    return this._http.delete(`/api/ib/${itemId}/${badgeId}`, this.options);
  }
}
