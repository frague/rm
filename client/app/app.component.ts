import { Component } from '@angular/core';
import { forkJoin } from 'rxjs';

import { AuthService } from './services/auth.service';
import { BadgeService } from './services/badge.service';
import { ItemBadgeService } from './services/itemBadge.service';
import { CacheService } from './services/cache.service';
import { BusService } from './services/bus.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  isFilterVisible = true;
  private $refetchBadges;

  public get isLogged(): boolean {
    return this.auth.loggedIn;
  }

  constructor(
    public auth: AuthService,
    private itemBadgeService: ItemBadgeService,
    private badgeService: BadgeService,
    private cache: CacheService,
    private bus: BusService
  ) {
  }

  private _refetchBadges() {
    forkJoin(
      this.badgeService.getAll(),
      this.itemBadgeService.getAll()
    )
      .subscribe(([badges, itemBadges]) => {
        let badgeById = badges.reduce((result, badge) => {
          result[badge._id] = badge;
          return result;
        }, {});
        this.cache.set('badges', badgeById);

        let itemsBadges = itemBadges.reduce((result, link) => {
          let ibs = result[link.itemId] || [];
          let badge = badgeById[link.badgeId];
          if (badge) {
            ibs.push(badge._id);
          }
          result[link.itemId] = ibs;
          return result;
        }, {});
        this.cache.set('itemBadges', itemsBadges);
        this.bus.badgeUpdated.emit();
      });
  }

  ngOnInit() {
    this.$refetchBadges = this.bus.reloadBadges.subscribe(() => this._refetchBadges());
    this._refetchBadges();
  }

  ngOnDestroy() {
    this.$refetchBadges.unsubscribe();
  }
}
