import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ERROR_ALREADY_REPORTED, ErrorReportService } from '../services/error-reporting/error-report.service';

/**
 * Opt-out for requests that must NEVER pop the big error dialog
 * (e.g. silent background polling like notification unread-count,
 * type-ahead search, expected 404 probes).
 *
 * Usage:
 * ```ts
 * import { SKIP_ERROR_DIALOG } from './interceptors/error.interceptor';
 * this.http.get(url, { context: new HttpContext().set(SKIP_ERROR_DIALOG, true) });
 * // or header: { headers: { 'X-Skip-Error-Dialog': 'true' } }
 * ```
 */
export const SKIP_ERROR_DIALOG = new HttpContextToken<boolean>(() => false);

/** Header-based opt-out (stripped before the request leaves the browser). */
export const SKIP_ERROR_DIALOG_HEADER = 'X-Skip-Error-Dialog';

/**
 * GLOBAL error interceptor — catches EVERY failed HTTP call on EVERY page
 * and shows the big copy-paste popup via ErrorReportService.
 *
 * - 401 is SKIPPED: authInterceptor already redirects to /login (a popup
 *   on top of the redirect would be pure noise).
 * - Errors flagged with SKIP_ERROR_DIALOG are rethrown silently so the
 *   calling page can handle them inline (toasts, empty states...).
 * - Every reported error is marked with ERROR_ALREADY_REPORTED so the
 *   global ErrorHandler doesn't open a SECOND popup for the same failure.
 * - The original error is always rethrown — page-level catchError / retry
 *   logic keeps working exactly as before.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const reports = inject(ErrorReportService);

  const skipViaContext = req.context.get(SKIP_ERROR_DIALOG);
  const skipViaHeader =
    req.headers.get(SKIP_ERROR_DIALOG_HEADER)?.toLowerCase() === 'true';

  const cleaned = skipViaHeader
    ? req.clone({ headers: req.headers.delete(SKIP_ERROR_DIALOG_HEADER) })
    : req;

  return next(cleaned).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        // Session expiry already redirects to /login — no popup.
        if (err.status === 401) return throwError(() => err);
        // Explicit opt-out (background polling etc.).
        if (skipViaContext || skipViaHeader) return throwError(() => err);

        try {
          (err as any)[ERROR_ALREADY_REPORTED] = true;
          reports.showNonBlocking(reports.buildFromHttp(cleaned, err));
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('errorInterceptor: failed to show error dialog', e);
        }
      }
      return throwError(() => err);
    }),
  );
};
