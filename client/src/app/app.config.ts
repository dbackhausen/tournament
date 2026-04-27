import {ApplicationConfig, LOCALE_ID} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { definePreset } from '@primeng/themes';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de'

registerLocaleData(localeDe)

const TennisPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50:  '#eef4fc',
      100: '#d5e5f7',
      200: '#aecbf0',
      300: '#7aabe6',
      400: '#4d8bda',
      500: '#3570c4',
      600: '#2a5aa8',
      700: '#22488a',
      800: '#1c3a72',
      900: '#172f5e',
      950: '#0d1c3a'
    }
  }
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: TennisPreset,
        options: { darkModeSelector: false }
      }
    }),
    { provide: LOCALE_ID, useValue: 'de-DE'}
  ]
};
