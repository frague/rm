import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseService } from './base.service';
import { Observable } from 'rxjs';
import { LoaderService } from './loader.service';

@Injectable()
export class InGridService extends BaseService {

  constructor(http: HttpClient, loader: LoaderService) {
    super('ingrid', http, loader);
  }

  get(login: string): Observable<any> {
    return super.get({_id: login});
  }

  getOrdinance(login: string): Observable<any> {
    return this.get(`${login}/ordinance`);
  }
}
