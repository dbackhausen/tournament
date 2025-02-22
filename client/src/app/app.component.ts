import { Component, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet, RouterLink } from '@angular/router';
import { LogoutComponent } from "src/app/components/logout/logout.component";
import { CommonModule } from "@angular/common";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, RouterOutlet, RouterLink, CommonModule, LogoutComponent],
  template: `
    <nav>
      <a routerLink="/login">Login</a> |
      <a routerLink="/register">Registrierung</a> |
      <a routerLink="/dashboard">Dashboard</a> |
      <a routerLink="/profile-edit">Mein Profil</a> |
      <app-logout></app-logout>
    </nav>
    <router-outlet></router-outlet>
  `
})
export class AppComponent implements OnInit {
  title = 'tournament';

  constructor() {
  }

  ngOnInit() {
  }
}
