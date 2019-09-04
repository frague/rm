import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Http } from '@angular/http';
import { BaseService } from './base.service';
import { LoaderService } from './loader.service';

@Injectable()
export class CandidateService extends BaseService {

  constructor(http: Http, loader: LoaderService) {
    super('candidate', http, loader);
  }

  getByRequisition(requisitionId: string): Observable<any> {
    return this
      .getAll({or: [{'$and':[{'candidate.requisitionId': requisitionId}]}]})
      .pipe(
        map(res => (res && res.length) ? res : [])
      );
  }

  getByLogin(login: string): Observable<any> {
    return this
      .getAll({or: [{'$and':[{'candidate.login': login}]}]})
      .pipe(
        map(res => (res && res.length) ? res[0] : {})
      );
  }
}
