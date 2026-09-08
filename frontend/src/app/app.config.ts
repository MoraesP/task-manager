import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localePt from '@angular/common/locales/pt';
import {
  ApplicationConfig,
  LOCALE_ID,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { errorInterceptor } from '@core/interceptors/error.interceptor';
import { routes } from './app.routes';

registerLocaleData(localePt, 'pt-BR');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptors([errorInterceptor, authInterceptor])),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    provideAppInitializer(() => inject(AuthService).initialize()),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
  ],
};
