import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';

@Injectable()
export class ItemBadgeService extends BaseService {

  constructor(http: Http) {
    super('ib', http);
  }
}
