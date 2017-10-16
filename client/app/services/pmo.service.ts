import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs';


@Injectable()
export class PmoService {

  constructor(private http: Http) {
  }

  getAccounts(): Observable<any> {
    return this.http.get('/api/pmo/accounts').map(res => res.json());
  }

  getPeople(): Observable<any> {
    return this.http.get('/api/pmo/people').map(res => res.json());
  }


}
