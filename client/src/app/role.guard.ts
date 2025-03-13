import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const expectedRole = route.data['role'] as 'PLAYER' | 'ADMIN';

  if (authService.getRole()?.toUpperCase() === expectedRole) {
    return true;
  } else {
    router.navigate(['/unauthorized']);
    return false;
  }
};
