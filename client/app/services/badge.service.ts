import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { BaseService } from './base.service';
import { LoaderService } from './loader.service';

const entity = 'badge';

@Injectable()
export class BadgeService extends BaseService {
  private _http: Http;
  private _loader: LoaderService;

  constructor(http: Http, loader: LoaderService) {
    super(entity, http, loader);
    [this._http, this._loader] = [http, loader];
  }

  getAllFor(itemId): Observable<any> {
    let id = this._loader.start();
    return this._http.get('/api/' + entity + 's/' + itemId).pipe(map(res => res.json()), tap(() => this._loader.complete(id)));
  }
}
