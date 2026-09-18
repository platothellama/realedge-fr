import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';

// PHASE 1: attach Bearer token and handle expired/invalid sessions centrally.
// On 401 (except for the auth endpoints themselves): clear local session once
// and redirect to /login. No retries -> no infinite loops.
// Public endpoints must never receive the Bearer token (it would leak into
// CDN/proxy logs on unauthenticated routes and serves no purpose there).
const PUBLIC_PATTERNS = [
  '/api/websites/public/',
  '/api/sign/',
  '/api/track/',
  '/api/features/enabled',
];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();
  const isPublic = PUBLIC_PATTERNS.some((p) => req.url.includes(p));

  const authed = token && !isPublic
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authed).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        const url = err.url ?? req.url;
        const isAuthCall = url.includes('/api/auth/');
        if (!isAuthCall && authService.isAuthenticatedSignal()) {
          authService.logout();
          router.navigate(['/login'], {
            queryParams: { session: 'expired' }
          });
        }
      }
      return throwError(() => err);
    })
  );
};
