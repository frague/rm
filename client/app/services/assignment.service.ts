import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseService } from './base.service';

@Injectable()
export class AssignmentService extends BaseService {

  constructor(http: Http) {
    super('assignment', http);
  }

  getByLogin(login: string): Observable<any> {
    return this
      .getAll({or: [{'$and':[{login}]}]})
      .pipe(
        map(({message, data}) => (data && data.length) ? data[0] : {})
      )
  }
}
