import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, finalize } from 'rxjs/operators';
import { BaseService } from './base.service';
import { LoaderService } from './loader.service';

const entity = 'badge';

@Injectable()
export class BadgeService extends BaseService {
  private _http: HttpClient;
  private _loader: LoaderService;

  constructor(http: HttpClient, loader: LoaderService) {
    super(entity, http, loader);
    [this._http, this._loader] = [http, loader];
  }

  getAllFor(itemId): Observable<any> {
    let id = this._loader.start();
    return this._http.get(`/api/${entity}s/${itemId}`)
      .pipe(
        finalize(() => this._loader.complete(id))
      );
  }
}
