import { Component, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from "@angular/common";
import { MenubarModule } from "primeng/menubar";
import { MenuItem, Translation} from "primeng/api";
import { AuthService } from "src/app/services/auth.service";
import { PrimeNG } from 'primeng/config';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    MenubarModule,
    RouterModule,
    CommonModule
  ],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  title = 'TC69 Turnierverwaltungssystem';
  items: MenuItem[] = [];
  isLoggedIn = false;

  constructor(
    private authService: AuthService,
    private primengConfig: PrimeNG,
  ) {
  }

  ngOnInit() {
    this.authService.isLoggedIn$.subscribe((loggedIn) => {
      this.isLoggedIn = loggedIn;
      this.updateMenu();
    })

    this.primengConfig.ripple.set(true);
  }

  updateMenu() {
    this.items = [
      { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: '/dashboard' },
      { label: 'Turniere', icon: 'pi pi-fw pi-calendar-times', routerLink: '/tournament' },
      { label: 'Mein Profil', icon: 'pi pi-fw pi-user', routerLink: '/profile-edit' },
      { label: 'Einstellungen', icon: 'pi pi-fw pi-user', routerLink: '/settings' },
      { label: 'Logout', icon: 'pi pi-fw pi-sign-out', command: () => this.logout() }
    ];
  }

  logout(): void {
    this.authService.logout();
  }
}
