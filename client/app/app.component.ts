import { Component, ViewChild, ViewChildren, ElementRef, QueryList } from '@angular/core';
import { forkJoin } from 'rxjs';

import { AuthService } from './services/auth.service';
import { BadgeService } from './services/badge.service';
import { ItemBadgeService } from './services/itemBadge.service';
import { DpService } from './services/dp.service';
import { CacheService } from './services/cache.service';
import { BusService, IUserModal } from './services/bus.service';
import { PrintableDatePipe } from './pipes';
import { PersonModal } from './modal/person-modal.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  isFilterVisible = true;
  private $refetchBadges;
  private $dbUpdated;
  private $showUser;

  public get isLogged(): boolean {
    return this.auth.loggedIn;
  }

  @ViewChildren('main') main: QueryList<ElementRef>;
  @ViewChild(PersonModal, { static: true }) personModal: PersonModal;

  dbUpdated = '?';

  constructor(
    public auth: AuthService,
    private itemBadgeService: ItemBadgeService,
    private deadPoolService: DpService,
    private badgeService: BadgeService,
    private cache: CacheService,
    private bus: BusService,
    private makeDate: PrintableDatePipe
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

  private _getDbUpdateDate() {
    this.deadPoolService.getUpdateDate().subscribe((date: string) => this.dbUpdated = this.makeDate.transform(new Date(date)));
  }

  ngOnInit() {
    this.$refetchBadges = this.bus.reloadBadges.subscribe(() => this._refetchBadges());
    this.$dbUpdated = this.bus.dbUpdated.subscribe(() => this._getDbUpdateDate());
    this._refetchBadges();
    this._getDbUpdateDate();
    this.$showUser = this.bus.showPerson.subscribe((info: IUserModal) => {
      this.personModal.show(info.entity, info.tab).subscribe(value => info.callback ? info.callback(value) : null);
    });
  }

  clicked = (element: HTMLElement) => {
    let name = element.innerText;
    if (name && name.startsWith('@')) {
      this.bus.showPerson.emit({entity: name.substr(1)});
    }
  };

  ngAfterViewChecked() {
    let marks = Array.from(document.getElementsByTagName('mark')).forEach((mark, index) => {
      if (!mark.onclick) mark.onclick = () => this.clicked(mark);
    });
  }

  ngOnDestroy() {
    [this.$refetchBadges, this.$dbUpdated].forEach(subscription => subscription.unsubscribe());
  }
}
