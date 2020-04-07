import { Component, ViewChild, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { SyncService } from '../services/sync.service';
import { DpService } from '../services/dp.service';
import { SocketService } from '../services/socket.service';
import { BadgeService} from '../services/badge.service';
import { BusService } from '../services/bus.service';
import { CacheService } from '../services/cache.service';

const tasks = {
  mandatory: true, dependants: {
    'users': {mandatory: false, dependants: {
      'pr': {mandatory: false},
      'visas': {mandatory: false},
      'whois': {mandatory: false},
      'assignments': {mandatory: true},
      'vacations': {mandatory: false},
    }},
    'demand': {mandatory: false},
    'accounts': {mandatory: false},
    'requisitions': {mandatory: false, dependants: {
      'candidates': {mandatory: false},
    }},
  }
};

@Component({
  selector: 'sync',
  templateUrl: './sync.component.html',
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class SyncComponent {

  @ViewChild('log', { static: false }) logWindow: ElementRef;
  @ViewChild('fileInput', { static: true }) fileInput: ElementRef;

  form: FormGroup;
  logs = [];
  stati = {};
  hasErrors = false;
  file: any = {name: ''};

  itemId = 'test';

  public get tasks(): any {
    return tasks;
  };

  selectedTasks = {};
  private $heartbeat;

  constructor(
    private syncService: SyncService,
    private dpService: DpService,
    private builder: FormBuilder,
    private socket: SocketService,
    private badgeService: BadgeService,
    private bus: BusService,
    private cache: CacheService,
    private cd: ChangeDetectorRef
 ) {
    this.form = this.builder.group({
      backup: null,
      merge: new FormControl(false)
    });

    // Workaround: after sync request completion log stops updating
    this.socket.subscribe((log, status) => this.trackSyncing(log, status));
  }

  ngOnInit() {
    this.$heartbeat = setInterval(() => this.trackSyncing(null, null), 1000);
  }

  ngOnDestroy() {
    clearInterval(this.$heartbeat);
  }

  addLog(text: string, source='') {
    let line = (source ? source + ': ' : '') + text;
    this.logs.push(line);
    this.hasErrors = this.hasErrors || line.indexOf('rror') > 0;

    if (this.logWindow) {
      this.logWindow.nativeElement.scrollBy(0, 50);
    }
  }

  collectTasks(states: any) {
    this.selectedTasks = states;
  }

  trackSyncing(log, status=null) {
    if (status && status[0]) {
      this.stati[status[0]] = status[1];
      if (status[1] === 'error') {
        this.hasErrors = true;
      }
    }

    if (log) {
      this.addLog(log);
      if (log === 'done') {
        this.stati = {};
        if (!this.hasErrors) {
          this.addLog('Diff generation...');
          this.cache.reset(['plans', 'demands', 'assignments', 'candidates', 'requisitions', 'initiatives', 'resources']);
          this.dpService.saveDiff().subscribe(() => {
            // Refresh update date on the UI
            this.bus.dbUpdated.emit();
          });
        } else {
        }
      }
    }
    this.cd.markForCheck();
  };

  sync() {
    this.stati = {};
    this.hasErrors = false;

    let tasksToExecute = Object.keys(this.selectedTasks).filter(key => !!this.selectedTasks[key]).join(',');

    this.syncService.goOn(tasksToExecute).subscribe(
      () => {},
      error => {
        this.stati = {};
        this.hasErrors = true;
        this.addLog(error.message, 'error');
      }
    );
  }

  backup() {
    this.syncService.backup().subscribe();
  }

  onFileChange(event) {
    let reader = new FileReader();
    if (event.target.files && event.target.files.length > 0) {
      let file = event.target.files[0];
      reader.readAsDataURL(file);
      reader.onload = () => {
        this.form.get('backup').setValue({
          filename: file.name,
          filetype: file.type,
          value: (reader.result as string).split(',')[1]
        })
      };
    }
  }

  public get fileChosen(): string {
    let backup = this.form.get('backup');
    return backup && backup.value && backup.value.filename ? backup.value.filename : '';
  }

  getButtonTitle(): string {
    return this.form.get('merge').value ? 'Merge' : 'Restore';
  }

  restore() {
    const formModel = this.form.value;
    this.syncService.restore(formModel)
      .subscribe(
        logs => {
          if (logs) {
            logs.forEach(log => this.addLog(log, 'Restore'));
          }
          // Invalidate badges cache
          this.bus.reloadBadges.emit();
        }
      );
  }

  getLogStyle(log: string) {
    return {
      error: `${log}`.includes('rror')
    };
  }

  cleanup() {
    this.syncService.cleanup()
      .subscribe(
        data => {
          if (data) {
            this.addLog(`${data.deleted} obsolete comments have been deleted:`, 'Cleanup');
            Object.keys(data.logins).sort().forEach(login => {
              let item = '';
              if (/^[a-z]+$/.test(login)) {
                item = `User ${login}`;
              } else if (/^\d/.test(login)) {
                item = `Demand #${login.replace(/_/g, ' ')}`;
              }

              this.addLog(` * ${item} (${data.logins[login]})`);
            });
          }
        }
      );
  }
}
