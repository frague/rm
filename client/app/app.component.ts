import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';
import { ActivatedRoute, Routes } from '@angular/router';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  isFilterVisible = true;

  constructor(
  	public auth: AuthService,
    private route: ActivatedRoute
  ) {
    const url = route.snapshot.data;
    console.log(url);
  }

}
