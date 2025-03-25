import { Component, OnInit } from '@angular/core';
import { AuthService } from "src/app/services/auth.service";
import { RouterLink } from "@angular/router";
import {Card} from "primeng/card";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    Card
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  username: string = '';

  constructor(private authService: AuthService) {}

  ngOnInit() {
    const user = this.authService.getUser();
    if (user) {
      this.username = user.username;
    }
  }
}
