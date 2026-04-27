import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';
import { roleGuard } from './role.guard';

export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('src/app/components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'tournament',
    loadComponent: () => import('src/app/components/tournament/tournament-overview/tournament-overview.component').then(m => m.TournamentOverviewComponent),
    canActivate: [authGuard]
  },
  {
    path: 'tournament/new',
    loadComponent: () => import('src/app/components/tournament/tournament-form/tournament-form.component').then(m => m.TournamentFormComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'ADMIN' }
  },
  {
    path: 'tournament/edit/:tournamentId',
    loadComponent: () => import('src/app/components/tournament/tournament-form/tournament-form.component').then(m => m.TournamentFormComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'ADMIN' }
  },
  {
    path: 'tournament/:tournamentId/registrations',
    loadComponent: () => import('src/app/components/registration/registration-overview/registration-overview.component').then(m => m.RegistrationOverviewComponent),
    canActivate: [authGuard]
  },
  {
    path: 'tournament/:tournamentId/register',
    loadComponent: () => import('src/app/components/registration/registration-form/registration-form.component').then(m => m.RegistrationFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'tournament/:tournamentId/registration/edit/:registrationId',
    loadComponent: () => import('src/app/components/registration/registration-form/registration-form.component').then(m => m.RegistrationFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'tournament/:id',
    loadComponent: () => import('src/app/components/tournament/tournament-detail/tournament-detail.component').then(m => m.TournamentDetailComponent),
    canActivate: [authGuard]
  },
  {
    path: 'user',
    loadComponent: () => import('src/app/components/user/user-overview/user-overview.component').then(m => m.UserOverviewComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'ADMIN' }
  },
  {
    path: 'user/:id',
    loadComponent: () => import('src/app/components/user/user-form/user-form.component').then(m => m.UserFormComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'ADMIN' }
  },
  {
    path: 'profile/:id',
    loadComponent: () => import('src/app/components/profile/profile-view/profile-view.component').then(m => m.ProfileViewComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profile/edit/:id',
    loadComponent: () => import('src/app/components/profile/profile-form/profile-form.component').then(m => m.ProfileFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('src/app/components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('src/app/components/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '**',
    loadComponent: () => import('src/app/components/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
