import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

@Injectable()
export class ResourceService {

  private headers = new Headers({ 'Content-Type': 'application/json', 'charset': 'UTF-8' });
  private options = new RequestOptions({ headers: this.headers });

  constructor(private http: Http) { }

  getAll(): Observable<any> {
    return this.http.get('/api/resources').map(res => res.json());
  }

  count(): Observable<any> {
    return this.http.get('/api/resources/count').map(res => res.json());
  }

  add(resource): Observable<any> {
    return this.http.post('/api/resource', JSON.stringify(resource), this.options);
  }

  get(resource): Observable<any> {
    return this.http.get(`/api/resource/${resource._id}`).map(res => res.json());
  }

  edit(resource): Observable<any> {
    return this.http.put(`/api/resource/${resource._id}`, JSON.stringify(resource), this.options);
  }

  delete(resource): Observable<any> {
    return this.http.delete(`/api/resource/${resource._id}`, this.options);
  }

}
