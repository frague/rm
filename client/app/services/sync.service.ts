import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';


@Injectable()
export class SyncService {

  constructor(private http: Http) {
  }

  goOn(tasks: string): Observable<any> {
    return this.http.post('/api/sync', {tasks});
  }

  backup(): Observable<any> {
    return this.http.get('/api/backup', {}).pipe(map(res => res.json()));
  }

  restore(data: any): Observable<any> {
    return this.http.post('/api/restore', data).pipe(map(res => res.json()));
  }

  cleanup(): Observable<any> {
    return this.http.get('/api/cleanup').pipe(map(res => res.json()));
  }
}
