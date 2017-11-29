import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs';


@Injectable()
export class SyncService {

  constructor(private http: Http) {
  }

  goOn(): Observable<any> {
    return this.http.post('/api/sync', {}).map(res => res.json());
  }

  backup(): Observable<any> {
    return this.http.get('/api/backup', {}).map(res => res.json());
  }

  restore(data: any): Observable<any> {
    console.log(data);
    return this.http.post('/api/restore', data);
  }

}
