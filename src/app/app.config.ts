import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { MAT_SELECT_CONFIG, MatSelectConfig } from '@angular/material/select';
import { MAT_MENU_DEFAULT_OPTIONS } from '@angular/material/menu';
import { authInterceptor } from './interceptors/auth.interceptor';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { hasBackdrop: true, disableClose: false } },
    { provide: MAT_SELECT_CONFIG, useValue: { hideSingleSelectionIndicator: false } as MatSelectConfig },
    { provide: MAT_MENU_DEFAULT_OPTIONS, useValue: { hasBackdrop: true, closeOnNavigation: true } }
  ]
};
