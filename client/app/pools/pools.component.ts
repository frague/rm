import { Component, OnInit } from '@angular/core';
import { profilesMap } from '../sync/mappings';


@Component({
  selector: 'pools',
  templateUrl: './pools.component.html'
})
export class PoolsComponent  {

  items = Object.keys(profilesMap).sort();

  constructor(
  ) {
  }
}
