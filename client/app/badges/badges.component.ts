import { Component } from '@angular/core';
import { BadgeService } from '../services/badge.service';
import { CacheService } from '../services/cache.service';
import { BusService } from '../services/bus.service';


@Component({
  selector: 'badges',
  templateUrl: './badges.component.html'
})
export class BadgesComponent {
  allBadges: any = {};
  newBadge: any = {};
  selected;
  private $badges;

  constructor(
    private badgeService: BadgeService,
    private cacheService: CacheService,
    private busService: BusService
  ) {
  }

  ngOnInit() {
    this.allBadges = this.cacheService.get('badges');
    this.$badges = this.busService.badgeUpdated.subscribe(() => {
      this.allBadges = this.cacheService.get('badges');
    });
  }

  ngOnDestroy() {
    this.$badges.unsubscribe();
  }

  getBadges() {
    return Object.values(this.allBadges || {}).sort((a: any, b: any) => a.title > b.title ? 1 : -1);
  }

  getBadgeStyle(badge: any) {
    return {
      backgroundColor: badge.color
    };
  }

  edit(badge: any) {
    this.newBadge = Object.assign({}, badge);
    this.selected = badge._id;
  }

  save() {
    this.badgeService.save(this.newBadge).subscribe(newBadge => {
      this.allBadges[newBadge._id] = newBadge;
      this.cacheService.set('badges', this.allBadges);
      this.busService.badgeUpdated.emit();
    })
      .add(() => this.cancel());
  }

  delete(badge: any) {
    this.badgeService.delete(badge).subscribe(() => {
      delete this.allBadges[badge._id];
      this.cacheService.set('badges', this.allBadges);
      this.busService.badgeUpdated.emit();
    });
  }

  cancel() {
    this.selected = null;
  }

  hotKeysHandler(event: KeyboardEvent) {
    switch (event.key) {
      case 'Escape':
        return this.cancel();
      case 'Enter':
        return this.save();
    }
  }
}