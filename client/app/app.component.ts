import { Component, ViewChild } from '@angular/core';
import { AuthService } from './services/auth.service';
import { PersonModal } from './modal/person-modal.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  @ViewChild(PersonModal) modal: PersonModal;

  isFilterVisible = true;

  constructor(public auth: AuthService) {}

  showModal() {
    this.modal.show();
  };
}
