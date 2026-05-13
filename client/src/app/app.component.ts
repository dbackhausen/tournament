import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { CommonModule } from "@angular/common";
import { AuthService } from "src/app/services/auth.service";
import { PrimeNG } from 'primeng/config';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  isLoggedIn = false;
  isAdmin = false;
  currentUserId: number | null = null;
  private destroyRef = inject(DestroyRef);

  constructor(
    private primengConfig: PrimeNG,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    if (this.authService.getToken() && this.authService.isTokenExpired()) {
      this.authService.logout();
    }

    this.authService.isLoggedIn$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((loggedIn) => {
      this.isLoggedIn = loggedIn;
      const user = this.authService.getUser();
      this.isAdmin = this.authService.isAdmin();
      this.currentUserId = user?.id ?? null;
    });

    this.primengConfig.ripple.set(true);
  }

  logout(): void {
    this.authService.logout();
  }
}
