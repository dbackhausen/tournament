import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { RouterModule, Routes } from '@angular/router';
import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser'
import { authGuard } from './auth.guard'
import { NotFoundComponent } from "src/app/components/not-found/not-found.component";
import { DashboardComponent } from "src/app/components/dashboard/dashboard.component";
import { TournamentOverviewComponent } from "src/app/components/tournament/tournament-overview/tournament-overview.component";
import { TournamentFormComponent } from "src/app/components/tournament/tournament-form/tournament-form.component";
import { ProfileEditComponent } from "src/app/components/profile-edit/profile-edit.component";
import { LoginComponent } from "src/app/components/login/login.component";
import { RegisterComponent } from "src/app/components/register/register.component";
import {
  RegistrationFormComponent
} from "src/app/components/registration/registration-form/registration-form.component";
import {
  RegistrationOverviewComponent
} from "src/app/components/registration/registration-overview/registration-overview.component";

export const routes: Routes = [
  {
    path: 'dashboard', component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'tournament', component: TournamentOverviewComponent,
    canActivate: [authGuard]
  },
  {
    path: 'tournament/new', component: TournamentFormComponent,
    canActivate: [authGuard]
  },
  {
    path: 'tournament/edit/:id', component: TournamentFormComponent,
    canActivate: [authGuard]
  },
  {
    path: 'tournament/registrations/:id', component: RegistrationOverviewComponent,
    canActivate: [authGuard]
  },
  {
    path: 'tournament/register/:id', component: RegistrationFormComponent,
    canActivate: [authGuard]
  },
  {
    path: 'tournament/register/edit/:id', component: RegistrationFormComponent,
    canActivate: [authGuard]
  },
  {
    path: 'profile-edit', component: ProfileEditComponent,
    canActivate: [authGuard]
  },
  {
    path: 'login', component: LoginComponent,
  },
  {
    path: 'register', component: RegisterComponent
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '**', component: NotFoundComponent
  }
];

@NgModule({
  declarations: [
  ],
  imports: [
    RouterModule.forRoot(routes),
    BrowserModule
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'de-DE' },
  ],
  bootstrap: [

  ]
})
export class AppModule {
  constructor() {
    registerLocaleData(localeDe);
  }
}
