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

  suggestions = null;
  suggestionIndex = -1;
  typed: any = {};

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
    this.reset();
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
    this.typed = Object.assign({}, this.newBadge);
    this.suggestions = [];
    this.suggestionIndex = -1;
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
        this.allBadges[item._id] = item;
        this.cacheService.set('badges', this.allBadges);
      },
      error => {
        if (error._body && error._body.includes('duplicate')) {
          // Failed to create a new badge with duplicate title
          let badge: any = Object.values(this.allBadges).find((badge: any) => badge.title == this.newBadge.title);
          if (badge && !this._isBadgeIncluded(badge._id)) {
            this._addBadge(badge);
          } else {
            console.log(`Unable to find existing badge ${this.newBadge.title} in`, this.allBadges);
          }
        }
      }
    );
  }

  private _updateSuggestions(): void {
    this.suggestionIndex = -1;
    let needle = this.newBadge.title.toLowerCase();
    this.suggestions = Object.values(this.allBadges)
      .filter((badge: any) => badge.title.toLowerCase().includes(needle))
      .sort((a: any, b: any) => a.title < b.title ? 1 : 1);
  }

  selectSuggestion(newIndex: number, doSave=false) {
    let l = this.suggestions.length;
    if (!l || newIndex < -1 || newIndex >= l) {
      return;
    }
    if (newIndex >= 0) {
      this.newBadge = this.suggestions[newIndex];
      if (doSave) {
        return this.save();
      }
    } else {
      this.newBadge = this.typed;
    }
    this.suggestionIndex = newIndex;
  }

  hotKeysHandler(event: KeyboardEvent) {
    let key = event.key;
    switch (key) {
      case 'Escape':
        return this.cancel();
      case 'Enter':
        return this.save();
      case 'ArrowUp':
        return this.selectSuggestion(this.suggestionIndex - 1);
      case 'ArrowDown':
        return this.selectSuggestion(this.suggestionIndex + 1);
        return;
      default:
        if (this.newBadge.title && this.suggestionIndex < 0) {
          this._updateSuggestions();
          this.typed = this.newBadge;
        }
    }
  }

  getBadgeCaption(badge: any) {
    if (!this.compactView) {
      return badge.title;
    } else if (badge.short) {
      return badge.short;
    }
    return (badge.title || '').toUpperCase().split(' ').map(w => w.substr(0, 1)).join('');
  }

  getBadgeStyle(badge: any) {
    return {'background-color': badge.color};
  }
}