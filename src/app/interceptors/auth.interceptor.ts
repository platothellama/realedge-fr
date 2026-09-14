import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';

// PHASE 1: attach Bearer token and handle expired/invalid sessions centrally.
// On 401 (except for the auth endpoints themselves): clear local session once
// and redirect to /login. No retries -> no infinite loops.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  const authed = token
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
