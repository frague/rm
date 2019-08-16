import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

import { BadgeService } from '../../services/badge.service';
import { ItemBadgeService } from '../../services/itemBadge.service';
import { CacheService } from '../../services/cache.service';
import { BusService } from '../../services/bus.service';

@Component({
  selector: 'badger',
  templateUrl: './badger.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BadgerComponent {
  @Input() itemId;
  @Input() allowManagement: boolean = true;
  @Input() compactView: boolean = false;

  isHovered = false;
  isEditing = false;

  allBadges = {};
  newBadge: any = {};

  private $badgesUpdated;

  get badges(): any[] {
    let ids = ((this.cacheService.get('itemBadges') || {})[this.itemId] || []);
    return ids.map(badgeId => this.allBadges[badgeId] || {title: '-'});
  }

  constructor(
    private badgeService: BadgeService,
    private itemBadgeService: ItemBadgeService,
    private cacheService: CacheService,
    private busService: BusService,
    private cd: ChangeDetectorRef
  ) {
  }

  ngOnInit() {
    this.allBadges = this.cacheService.get('badges');

    this.$badgesUpdated = this.busService.badgeUpdated.subscribe(itemId => {
      this.allBadges = this.cacheService.get('badges');
      if (!itemId || itemId == this.itemId) {
        this.cd.markForCheck();
      }
    });
  }

  ngOnDestroy() {
    this.$badgesUpdated.unsubscribe();
  }

  reset() {
    this.newBadge = {
      title: '',
      color: '#f7fafb'
    };
  }

  add() {
    if (this.isEditing) return;
    this.reset();
    this.isEditing = true;
  }

  cancel() {
    this.isEditing = false;
    this.isHovered = false;
    this.reset();
  }

  private _updateBadges() {
    this.busService.badgeUpdated.emit(this.itemId);
  }

  delete(badge) {
    this.itemBadgeService.deleteByIds(this.itemId, badge._id).subscribe(() => {
      let allItemBadges = this.cacheService.get('itemBadges');
      let ibs = allItemBadges[this.itemId] || [];
      let index = ibs.indexOf(badge._id);
      if (index >= 0) {
        ibs.splice(index, 1);
        allItemBadges[this.itemId] = ibs;
        this.cacheService.set('itemBadges', allItemBadges);
        this._updateBadges();
      }
    });
  }

  private _addBadge(badge) {
    this.itemBadgeService.add({itemId: this.itemId, badgeId: badge._id}).subscribe(itemBadge => {
      let allItemBadges = this.cacheService.get('itemBadges');
      let ibs = allItemBadges[this.itemId] || [];
      ibs.push(badge._id);
      allItemBadges[this.itemId] = ibs;
      this.cacheService.set('itemBadges', allItemBadges);
      this.cancel();
      this._updateBadges();
    });
  }

  private _isBadgeIncluded(badgeId): boolean {
    return this.badges.some(badge => badge._id === badgeId);
  }

  cancelBubbling(event: MouseEvent) {
    event.cancelBubble = true;
  }

  save() {
    this.badgeService.save(this.newBadge).subscribe(
      item => {
        // Add/update the badge
        this._addBadge(item);
        let allBadges = this.cacheService.get('badges');
        allBadges[item._id] = item;
        this.cacheService.set('badges', allBadges);
      },
      error => {
        if (error._body && error._body.includes('duplicate')) {
          // Failed to create a new badge with duplicate title
          let badge: any = Object.values(this.cacheService.get('badges') || {}).find((badge: any) => badge.title == this.newBadge.title);
          if (badge && !this._isBadgeIncluded(badge._id)) {
            this._addBadge(badge);
          }
        }
      }
    );
  }

  hotKeysHandler(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.cancel();
    } else if (event.key === 'Enter') {
      this.save();
    }
  }

  getBadgeCaption(badge: any) {
    return this.compactView ? (badge.title || '').toUpperCase().split(' ').map(w => w.substr(0, 1)).join('') : badge.title;
  }

  getBadgeStyle(badge: any) {
    return {'background-color': badge.color};
  }
}