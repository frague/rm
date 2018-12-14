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
  close = () => {};

  constructor(private bus: BusService) {

  }

  resetClose() {
    this.close = () => this.isVisible = false;
  }

  ngOnInit() {
    this.resetClose();
    this.$visibility = this.bus.editedContent.subscribe(({data, resolve, reject}) => {
      // let _data = Object.assign({}, data);
      this.form.setValue(data);
      this.isVisible = true;
      this.close = (returnData = false) => {
        this.isVisible = false;
        this.resetClose();
        if (returnData) {
          resolve(this.editedValue);
        } else {
          reject();
        }
      };
    });
  }

  ngOnDestroy() {
    this.$visibility.unsubscribe();
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