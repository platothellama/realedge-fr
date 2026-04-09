import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { MAT_SELECT_CONFIG, MatSelectConfig } from '@angular/material/select';
import { MAT_MENU_DEFAULT_OPTIONS } from '@angular/material/menu';
import { authInterceptor } from './interceptors/auth.interceptor';
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
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    provideNativeDateAdapter(),
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { hasBackdrop: true, disableClose: false } },
    { provide: MAT_SELECT_CONFIG, useValue: { hideSingleSelectionIndicator: false } as MatSelectConfig },
    { provide: MAT_MENU_DEFAULT_OPTIONS, useValue: { hasBackdrop: true, closeOnNavigation: true } },
    { provide: APP_INITIALIZER, useFactory: initializeApp, deps: [GoogleMapsService], multi: true }
  ]
};
