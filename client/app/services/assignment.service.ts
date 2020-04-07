import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseService } from './base.service';
import { LoaderService } from './loader.service';

@Injectable()
export class AssignmentService extends BaseService {

  constructor(http: HttpClient, loader: LoaderService) {
    super('assignment', http, loader);
  }

  getByLogin(login: string): Observable<any> {
    return this
      .getAll({or: [{'$and':[{login}]}]})
      .pipe(
        map(({message, data}) => (data && data.length) ? data[0] : {})
      )
  }
}
