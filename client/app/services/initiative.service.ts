import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseService } from './base.service';
import { LoaderService } from './loader.service';

@Injectable()
export class InitiativeService extends BaseService {

  constructor(http: HttpClient, loader: LoaderService) {
    super('initiative', http, loader);
  }

}
