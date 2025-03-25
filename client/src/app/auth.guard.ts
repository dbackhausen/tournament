import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (state.url === '/login' && authService.isLoggedIn()) {
    return router.parseUrl('/dashboard');
  }

  if (state.url === '/register' && authService.isLoggedIn()) {
    return router.parseUrl('/dashboard');
  }

  if (!authService.isLoggedIn()) {
    return router.parseUrl('/login');
  }

  return true;
};
