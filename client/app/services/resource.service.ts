import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { BaseService } from './base.service';
import { Observable } from 'rxjs';

@Injectable()
export class ResourceService extends BaseService {

  httpService: Http;

  constructor(http: Http) {
    super('resource', http);
    this.httpService = http;
  }

  getWhois(): Observable<any> {
    return this.httpService.get('/api/confluence/whois').map(res => res.json());
  }

  getVisas(): Observable<any> {
    return this.httpService.get('/api/confluence/visas').map(res => res.json());
  }
}
