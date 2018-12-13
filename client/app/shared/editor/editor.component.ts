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
    // _id: new FormControl(''),
    // login: new FormControl(''),
    // date: new FormControl(''),
    isStatus: new FormControl(),
    subject: new FormControl(''),
    content: new FormControl('', Validators.required)
  });

  $visibility;
  isVisible = false;
  data: IEditedContent = {subject: '', content: '', isStatus: false};
  close = () => {};

  constructor(private bus: BusService) {

  }

  resetClose() {
    this.close = () => this.isVisible = false;
  }

  ngOnInit() {
    this.resetClose();
    this.$visibility = this.bus.editedContent.subscribe(({data, resolve, reject}) => {
      let _data = Object.assign({}, data);
      this.form.setValue(_data);
      console.log(_data);
      this.isVisible = true;
      this.close = (returnData = false) => {
        console.log(returnData);
        this.isVisible = false;
        this.resetClose();
        if (returnData) {
          resolve(data);
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