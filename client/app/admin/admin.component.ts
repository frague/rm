import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { ToastComponent } from '../shared/toast/toast.component';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

import { BaseComponent } from '../base.component';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html'
})
export class AdminComponent extends BaseComponent implements OnInit {

  form = new FormGroup({});

  constructor(
    public auth: AuthService,
    public toast: ToastComponent,
    userService: UserService
  ) {
    super(userService);
  }
}
