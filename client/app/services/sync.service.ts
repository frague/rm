import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';


@Injectable()
export class SyncService {

  constructor(private http: HttpClient) {
  }

  goOn(tasks: string): Observable<any> {
    return this.http.post('/api/sync', {tasks});
  }

  backup(): Observable<any> {
    return this.http.get('/api/backup', {});
  }

  restore(data: any): Observable<any> {
    return this.http.post('/api/restore', data);
  }

  cleanup(): Observable<any> {
    return this.http.get('/api/cleanup');
  }
}
