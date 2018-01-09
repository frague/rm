import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/retry';
import 'rxjs/add/operator/timeout';

@Injectable()
export class SyncService {

  constructor(private http: Http) {
  }

  goOn(): Observable<any> {
    return this.http.post('/api/sync', {});
  }

  backup(): Observable<any> {
    return this.http.get('/api/backup', {}).map(res => res.json());
  }

  restore(data: any): Observable<any> {
    return this.http.post('/api/restore', data);
  }

}
