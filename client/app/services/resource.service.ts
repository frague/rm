import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { BaseService } from './base.service';
import { Observable } from 'rxjs';

@Injectable()
export class ResourceService extends BaseService {

  httpService: Http;

  constructor(http: Http) {
    super('resource', http);
  }

  getByLogin(login: string): Observable<any> {
  	return this
  	  .getAll({or: [{'$and':[{login}]}]})
      .map(res => {
        return (res && res.length) ? res[0] : {};
      });
  }
}
