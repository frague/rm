import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';

type baseServiceType = {
  getAll: Function,
  count?: Function,
  add: Function,
  edit: Function,
  delete: Function,
  login?: Function,
  register?: Function
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

  getAll(criteria?: any): Subscription {
    return this.apiService.getAll(criteria).subscribe(
      data => this.items = data,
      error => console.log(error)
    );
  }

  add(item) {
    return this.apiService.add(item).subscribe(
      res => {
        this.form.reset();
      },
      error => console.log(error)
    );
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
  }

  getEditedValue() {
    // Needed for presubmit customizations
    return this.form.value;
  }

  save(): Subscription {
    let updatedItem = this.getEditedValue();
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
        },
        error => console.log(error)
      );
    }
  }
}