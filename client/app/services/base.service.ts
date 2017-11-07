import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, URLSearchParams } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

export class BaseService {

  private headers = new Headers({
    'Content-Type': 'application/json',
    'charset': 'UTF-8'
  });

  options = new RequestOptions({ headers: this.headers });
  private entity;

  constructor(entity: string, private http: Http) {
    this.entity = entity;
  }

  getAll(params={}): Observable<any> {
    let query = new URLSearchParams();
    for (let key in params) {
      query.set(key, params[key]) 
    }
    return this.http.get('/api/' + this.entity + 's?' + query.toString()).map(res => res.json());
  }

  count(): Observable<any> {
    return this.http.get('/api/' + this.entity + '/count').map(res => res.json());
  }

  add(item: any): Observable<any> {
    return this.http.post('/api/' + this.entity, JSON.stringify(item), this.options).map(res => res.json());
  }

  get(item: any): Observable<any> {
    return this.http.get('/api/' + this.entity + '/' + item._id).map(res => res.json());
  }

  edit(item: any): Observable<any> {
    return this.http.put('/api/' + this.entity + '/' + item._id, JSON.stringify(item), this.options).map(res => res.json());
  }

  delete(item: any): Observable<any> {
    return this.http.delete('/api/' + this.entity + '/' + item._id, this.options);
  }

  deleteAll(): Observable<any> {
    return this.http.delete('/api/' + this.entity + 's', this.options);
  }
}
