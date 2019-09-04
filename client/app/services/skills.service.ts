import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { BaseService } from './base.service';
import { Observable } from 'rxjs';
import { LoaderService } from './loader.service';

@Injectable()
export class SkillsService extends BaseService {

  constructor(http: Http, loader: LoaderService) {
    super('skills', http, loader);
  }

  get(login: string): Observable<any> {
    return super.get({_id: login});
  }

  getInfo(login: string): Observable<any> {
    return this.get(login + '/info');
  }
}
