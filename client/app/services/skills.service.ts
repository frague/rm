import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseService } from './base.service';
import { Observable } from 'rxjs';
import { LoaderService } from './loader.service';

@Injectable()
export class SkillsService extends BaseService {

  constructor(http: HttpClient, loader: LoaderService) {
    super('skills', http, loader);
  }

  get(login: string): Observable<any> {
    return super.get({_id: login});
  }

  getInfo(login: string): Observable<any> {
    return this.get(`${login}/info`);
  }
}
