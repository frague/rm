import { Component, Input, ChangeDetectorRef, EventEmitter } from '@angular/core';
import { LoaderService } from '../../services/loader.service';

@Component({
	selector: 'spinner',
  templateUrl: './spinner.component.html'
})
export class SpinnerComponent {
  private $updated;

  ngOnInit() {
    this.$updated = this.loader.updated.subscribe(() => this.cd.markForCheck());
  }

  ngOnDestroy() {
    this.$updated.unsubscribe();
  }

  get isShown(): boolean {
    return this.loader.isLoading;
  }

  get threads(): number {
    return this.loader.threadsInProgress;
  }

  get timer(): string {
    return this.loader.loadingTime;
  }

  @Input() showContent = true;

  constructor(
    private loader: LoaderService,
    private cd: ChangeDetectorRef,
  ) {}
}