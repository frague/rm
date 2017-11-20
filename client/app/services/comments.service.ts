import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { BaseService } from './base.service';
import { Observable } from 'rxjs';

@Injectable()
export class CommentService extends BaseService {

  private _http: Http;

  constructor(http: Http) {
    super('comment', http);
    this._http = http;
  }

  getAll(login: string): Observable<any> {
    return super.getAll({login});
  }
}
