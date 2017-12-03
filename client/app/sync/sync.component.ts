import { Component, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SyncService } from '../services/sync.service';
import { DpService } from '../services/dp.service';

@Component({
  selector: 'sync',
  templateUrl: './sync.component.html'
})
export class SyncComponent {

  @ViewChild('log') logWindow: ElementRef;
  @ViewChild('fileInput') fileInput: ElementRef;

  form: FormGroup;
  logs = [];
  isLoading = false;

  constructor(
    private syncService: SyncService,
    private dpService: DpService,
    private builder: FormBuilder
 ) {
    this.form = this.builder.group({
      backup: null
    });
  }

  private addLog(text: string, source='') {
    this.logs.push((source ? source + ': ' : '') + text);
    if (this.logWindow) {
      this.logWindow.nativeElement.scrollBy(0, 50);
    }
  }

  sync() {
    this.isLoading = true;
    this.syncService.goOn().subscribe(logs => {
      this.isLoading = false;
      this.logs = logs;
      this.dpService.saveDiff().subscribe();
    });
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
          value: reader.result.split(',')[1]
        })
      };
    }
  }

  onSubmit() {
    const formModel = this.form.value;
    this.isLoading = true;
    this.syncService.restore(formModel).subscribe(() => {
      this.isLoading = false;
    });
  }
}
