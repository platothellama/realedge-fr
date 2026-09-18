import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER, ErrorHandler } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { MAT_SELECT_CONFIG, MatSelectConfig } from '@angular/material/select';
import { MAT_MENU_DEFAULT_OPTIONS } from '@angular/material/menu';
import { authInterceptor } from './interceptors/auth.interceptor';
import { loadingInterceptor } from './interceptors/loading.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';
import { GlobalErrorHandler } from './services/error-reporting/global-error-handler';
import { GoogleMapsService } from './services/google-maps.service';

import { routes } from './app.routes';

export function initializeApp(googleMapsService: GoogleMapsService) {
  return () => googleMapsService.load().catch(err => {
    console.error('Failed to load Google Maps:', err);
    return Promise.resolve();
  });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // Order: auth -> loading -> error (error last so it sees final failures
    // and pops the big copy-paste dialog for EVERY failed call, all pages).
    provideHttpClient(withInterceptors([authInterceptor, loadingInterceptor, errorInterceptor])),
    provideAnimations(),
    provideNativeDateAdapter(),
    // Global client-crash handler: same big popup for uncaught JS errors.
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { hasBackdrop: true, disableClose: false, maxWidth: '95vw', closeOnNavigation: true } },
    { provide: MAT_SELECT_CONFIG, useValue: { hideSingleSelectionIndicator: false } as MatSelectConfig },
    { provide: MAT_MENU_DEFAULT_OPTIONS, useValue: { hasBackdrop: true, closeOnNavigation: true } },
    { provide: APP_INITIALIZER, useFactory: initializeApp, deps: [GoogleMapsService], multi: true }
  ]
};
