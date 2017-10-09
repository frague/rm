// import { ToastComponent } from './shared/toast/toast.component';
import { FormGroup } from '@angular/forms';

type baseServiceType = {
  getAll: Function,
  add: Function,
  edit: Function,
  delete: Function
};

export class BaseComponent {
  items = [];
  item = {};
  isLoading = false;
  isEditing = false;

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
        const newItem = res.json();
        this.items.push(newItem);
        // this.form.reset();
        // this.toast.setMessage('item added successfully.', 'success');
      },
      error => console.log(error)
    );
  }

  enableEditing(item) {
    this.isEditing = true;
    this.item = item;
  }

  cancelEditing() {
    this.isEditing = false;
    this.item = {};
    // this.toast.setMessage('item editing cancelled.', 'warning');
    this.getAll();
  }

  edit(item) {
    return this.apiService.edit(item).subscribe(
      res => {
        this.isEditing = false;
        this.item = item;
        // this.toast.setMessage('item edited successfully.', 'success');
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