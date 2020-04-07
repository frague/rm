import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseService } from './base.service';
import { Observable } from 'rxjs';
import { LoaderService } from './loader.service';

@Injectable()
export class CommentService extends BaseService {

  private _http: HttpClient;

  constructor(http: HttpClient, loader: LoaderService) {
    super('comment', http, loader);
    this._http = http;
  }

  getAll(login: string): Observable<any> {
    return super.getAll({login});
  }
}
