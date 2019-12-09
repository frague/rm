import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, URLSearchParams } from '@angular/http';

import { Observable } from 'rxjs';
import { map, tap, finalize } from 'rxjs/operators';

import { LoaderService } from './loader.service';


export class BaseService {

  private headers = new Headers({
    'Content-Type': 'application/json',
    'charset': 'UTF-8'
  });

  options = new RequestOptions({ headers: this.headers });
  private entity;

  constructor(entity: string, private http: Http, private loader: LoaderService) {
    this.entity = entity;
  }

  getAll(params={}): Observable<any> {
    let id = this.loader.start();
    let query = new URLSearchParams();
    for (let key in params) {
      query.set(key, JSON.stringify(params[key]));
    }
    return this.http.get('/api/' + this.entity + 's?' + query.toString())
      .pipe(
        map(res => res.json()),
        finalize(() => this.loader.complete(id))
      );
  }

  count(): Observable<any> {
    let id = this.loader.start();
    return this.http.get('/api/' + this.entity + '/count')
      .pipe(
        map(res => res.json()),
        finalize(() => this.loader.complete(id))
      );
  }

  get(item: any): Observable<any> {
    let id = this.loader.start();
    return this.http.get('/api/' + this.entity + '/' + (item._id || item))
      .pipe(
        map(res => res.json()),
        finalize(() => this.loader.complete(id))
      );
  }

  save(item: any): Observable<any> {
    return item._id ? this.edit(item) : this.add(item);
  }

  add(item: any): Observable<any> {
    let id = this.loader.start();
    return this.http.post('/api/' + this.entity, JSON.stringify(item), this.options)
      .pipe(
        map(res => res.json()),
        finalize(() => this.loader.complete(id))
      );
  }

  edit(item: any): Observable<any> {
    let id = this.loader.start();
    return this.http.put('/api/' + this.entity + '/' + item._id, JSON.stringify(item), this.options)
      .pipe(
        map(res => res.json()),
        finalize(() => this.loader.complete(id))
      );
  }

  delete(item: any): Observable<any> {
    let id = this.loader.start();
    return this.http.delete('/api/' + this.entity + '/' + item._id, this.options)
      .pipe(
        finalize(() => this.loader.complete(id))
      );
  }

  deleteAll(): Observable<any> {
    let id = this.loader.start();
    return this.http.delete('/api/' + this.entity + 's', this.options)
      .pipe(
        finalize(() => this.loader.complete(id))
      );
  }
}
