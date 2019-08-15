import { Component } from '@angular/core';
import { forkJoin } from 'rxjs';

import { AuthService } from './services/auth.service';
import { BadgeService } from './services/badge.service';
import { ItemBadgeService } from './services/itemBadge.service';
import { CacheService } from './services/cache.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  isFilterVisible = true;

  public get isLogged(): boolean {
    return this.auth.loggedIn;
  }
  
  constructor(
    public auth: AuthService,
    private itemBadgeService: ItemBadgeService,
    private badgeService: BadgeService,
    private cacheService: CacheService
  ) {
  }

  ngOnInit() {
    forkJoin(
      this.badgeService.getAll(),
      this.itemBadgeService.getAll()
    )
      .subscribe(([badges, itemBadges]) => {
        let badgeById = badges.reduce((result, badge) => {
          result[badge._id] = badge;
          return result;
        }, {});

        let itemsBadges = itemBadges.reduce((result, link) => {
          let ibs = result[link.itemId] || [];
          let badge = badgeById[link.badgeId];
          if (badge) {
            ibs.push(badge);
            ibs.sort();
          }
          result[link.itemId] = ibs;
          return result;
        }, {});

        this.cacheService.set('badges', itemsBadges);
      });
  }
}
