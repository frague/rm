import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html'
})
export class AccountComponent implements OnInit {

  user = {};

  constructor(private auth: AuthService, private userService: UserService) { }

  ngOnInit() {
    this.getUser();
  }

  getUser() {
    this.userService.get(this.auth.currentUser).subscribe(
      data => this.user = data,
      error => console.log(error)
    );
  }

  save(user) {
    this.userService.edit(user).subscribe(
      res => {},
      error => console.log(error)
    );
  }

}
