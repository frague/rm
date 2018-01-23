import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { BaseService } from './base.service';
import { Observable } from 'rxjs';

@Injectable()
export class SkillsService extends BaseService {

  constructor(http: Http) {
    super('skills', http);
  }

  get(login: string): Observable<any> {
    return super.get({_id: login});
  }

  getInfo(login: string): Observable<any> {
    return this.get(login + '/info');
  }
}
