import { Component, ViewChild } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  isFilterVisible = true;
  public get isLogged(): boolean {
    return this.auth.loggedIn;
  }
  
  constructor(public auth: AuthService) {}
}
