import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { BaseService } from './base.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LoaderService } from './loader.service';


@Injectable()
export class ResourceService extends BaseService {

  httpService: Http;

  constructor(http: Http, loader: LoaderService) {
    super('resource', http, loader);
  }

  getByLogin(login: string): Observable<any> {
  	return this
  	  .getAll({or: [{'$and':[{login}]}]})
      .pipe(
        map(res => (res && res.length) ? res[0] : {})
      );
  }
}
