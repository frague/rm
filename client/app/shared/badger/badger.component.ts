import { Component, Input } from '@angular/core';

import { BadgeService } from '../../services/badge.service';
import { ItemBadgeService } from '../../services/itemBadge.service';
import { CacheService } from '../../services/cache.service';

@Component({
  selector: 'badger',
  templateUrl: './badger.component.html'
})
export class BadgerComponent {
  @Input() itemId;
  @Input() allowManagement: boolean = true;
  @Input() compactView: boolean = false;

  isHovered = false;
  isEditing = false;

  newBadge: any = {};

  get badges(): any[] {
    return (this.cacheService.get('badges') || {})[this.itemId] || [];
  }

  constructor(
    private badgeService: BadgeService,
    private itemBadgeService: ItemBadgeService,
    private cacheService: CacheService
  ) {
  }

  reset() {
    this.newBadge = {
      title: '',
      color: '#acb6b8'
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

  private _updateBadges(badges: any[]) {
    let all = this.cacheService.get('badges');
    all[this.itemId] = badges;
    // Emit the update
  }

  delete(badge, index) {
    this.itemBadgeService.deleteByIds(this.itemId, badge._id).subscribe(() => {
      this.badges.splice(index, 1);
      this._updateBadges(this.badges);
    });
  }

  private _addBadge(badge) {
    this.itemBadgeService.add({itemId: this.itemId, badgeId: badge._id}).subscribe(() => {
      this.badges.push(badge);
      this.cancel();
      this._updateBadges(this.badges);
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
      item => this._addBadge(item),
      error => {
        if (error._body && error._body.includes('duplicate')) {
          this.badgeService.getAll({title: this.newBadge.title}).subscribe(([item]) => {
            if (!this._isBadgeIncluded(item._id)) {
              this._addBadge(item);
            }
          });
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