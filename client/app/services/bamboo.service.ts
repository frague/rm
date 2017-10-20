import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs';


@Injectable()
export class BambooService {

  constructor(private http: Http) {
  }

  getTimeoffs(): Observable<any> {
    return this.http.get('/api/bamboo').map(res => res.json());
  }

}
