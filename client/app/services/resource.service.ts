import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseService } from './base.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LoaderService } from './loader.service';


@Injectable()
export class ResourceService extends BaseService {

  httpService: HttpClient;

  constructor(http: HttpClient, loader: LoaderService) {
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
