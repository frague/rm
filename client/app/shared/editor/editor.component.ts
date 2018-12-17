import { Component, ViewChild, ElementRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BusService, IEditedContent } from '../../services/bus.service';

@Component({
  selector: 'editor',
  templateUrl: './editor.component.html'
})
export class EditorComponent {
  @ViewChild('markdown') markdown: ElementRef;

  form = new FormGroup({
    _id: new FormControl(''),
    login: new FormControl(''),
    date: new FormControl(''),
    isStatus: new FormControl(),
    source: new FormControl(''),
    text: new FormControl('', Validators.required)
  });

  public get editedValue(): any {
    return this.form.value;
  }

  $visibility;
  isVisible = false;
  data: IEditedContent = {source: '', text: '', isStatus: false};
  close = (returnData=false) => {};

  constructor(private bus: BusService) {

  }

  resetClose() {
    this.close = (returnData=false) => this.isVisible = false;
  }

  ngOnInit() {
    this.resetClose();
    this.$visibility = this.bus.editedContent.subscribe(({data, resolve, reject}) => {
      this.form.setValue(data);
      this.manageListener(true);
      this.isVisible = true;
      this.close = (returnData = false) => {
        this.isVisible = false;
        this.resetClose();
        if (returnData) {
          this.manageListener();
          resolve(this.editedValue);
        } else {
          this.manageListener();
          reject();
        }
      };
    });
  }

  ngOnDestroy() {
    this.$visibility.unsubscribe();
  }

  manageListener(add = false) {
    (add ? window.addEventListener : window.removeEventListener)('keyup', (event: KeyboardEvent) => this.hotKeysHandler(event));
  }

  hotKeysHandler(event: KeyboardEvent) {
    console.log(event.key, event.ctrlKey, event.metaKey);
    if (event.key === 'Escape') {
      this.close();
    } else if (event.key === 'Enter' && event.ctrlKey) {
      this.close(true);
    }
  }

  isFormValid() {
    return this.form.status !== 'INVALID';
  }

  reposition(event: Event) {
    setTimeout(() => {
      let textarea = event.srcElement;
      let markdown = this.markdown;
      if (textarea && markdown) {
        let percents = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight);
        let height = markdown.nativeElement.scrollHeight - markdown.nativeElement.clientHeight;
        markdown.nativeElement.scrollTop = Math.round(percents * height);
      }
    }, 0);
  }
}