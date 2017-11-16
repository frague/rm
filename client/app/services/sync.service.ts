import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs';


@Injectable()
export class SyncService {

  constructor(private http: Http) {
  }

  goOn(): Observable<any> {
    return this.http.post('/api/sync', {});
  }

}
