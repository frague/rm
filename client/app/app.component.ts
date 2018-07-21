import { Component, ViewChild } from '@angular/core';
import { AuthService } from './services/auth.service';
import { AssignmentModal } from './modal/assignment-modal.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  @ViewChild(AssignmentModal) modal: AssignmentModal;

  isFilterVisible = true;

  constructor(public auth: AuthService) {}

  showModal() {
    // this.modal.show();
  };
}
