// import { ToastComponent } from './shared/toast/toast.component';
import { FormGroup } from '@angular/forms';

type baseServiceType = {
  getAll: Function,
  add: Function,
  edit: Function,
  delete: Function
};

const isDate = new RegExp(/^[12]\d{3}\-/);

export abstract class BaseComponent {
  items = [];
  item: any = {};
  isLoading = false;
  isEditing = false;

  abstract form: FormGroup;

   constructor(
    private apiService: baseServiceType
  ) {
  }

  ngOnInit() {
    this.getAll();
  }

  getAll() {
    return this.apiService.getAll().subscribe(
      data => this.items = data,
      error => console.log(error),
      () => this.isLoading = false
    );
  }

  add(item) {
    return this.apiService.add(item).subscribe(
      res => {
        this.getAll();
        this.form.reset();
      },
      error => console.log(error)
    );
  }

  leadingZero(value: number): string {
    return ('0' + value).substr(-2);
  }

  formatDate(date: Date): string {
    return date.getFullYear() + '-' + '0' + this.leadingZero(date.getMonth() + 1) + '-' + this.leadingZero(date.getDate());
  }

  enableEditing(item) {
    this.item = item;
    let o: any = Object.assign({}, item);
    delete o.__v;
    Object.keys(o).forEach(key => {
      let v = o[key];
      if (isDate.test(v)) {
        o[key] = v.substr(0, 10);
      }
    });
    console.log(o);
    this.form.setValue(o);
  }

  cancelEditing() {
    this.item = {};
    // this.toast.setMessage('item editing cancelled.', 'warning');
  }

  save() {
    let updatedItem = this.form.value;
    if (this.item && this.item._id) {
      updatedItem._id = this.item._id;
      return this.edit(updatedItem);
    } else {
      delete updatedItem._id;
      return this.add(updatedItem);
    }
  }

  edit(item) {
    return this.apiService.edit(item).subscribe(
      res => {
        this.item = {};
        this.form.reset();
        // this.toast.setMessage('item edited successfully.', 'success');
        this.getAll();
      },
      error => console.log(error)
    );
  }

  delete(item) {
    if (window.confirm('Are you sure you want to permanently delete this item?')) {
      this.apiService.delete(item).subscribe(
        res => {
          const pos = this.items.map(elem => elem._id).indexOf(item._id);
          this.items.splice(pos, 1);
          // this.toast.setMessage('item deleted successfully.', 'success');
        },
        error => console.log(error)
      );
    }
  }
}