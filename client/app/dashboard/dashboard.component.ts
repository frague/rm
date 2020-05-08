import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  constructor(
    public auth: AuthService,
  ) {}
}