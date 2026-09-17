import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading/loading.service';

/**
 * Opt-out flag for requests that must NOT trigger the global loader
 * (e.g. silent background polling like notification unread-count).
 *
 * Usage:
 * ```ts
 * import { SKIP_LOADER } from './interceptors/loading.interceptor';
 * this.http.get(url, { context: new HttpContext().set(SKIP_LOADER, true) });
 * ```
 */
export const SKIP_LOADER = new HttpContextToken<boolean>(() => false);

/** Header-based opt-out (stripped before the request leaves the browser). */
export const SKIP_LOADER_HEADER = 'X-Skip-Loader';

/**
 * Shows the global loader overlay while any tracked HTTP call is in flight.
 * - Tracks concurrent requests with a counter in LoadingService.
 * - `finalize` guarantees hide() on success, error, and cancellation.
 * - Skipped when `SKIP_LOADER` context is true or `X-Skip-Loader: true` header is set.
 * - Never blocks auth/session handling: order with authInterceptor does not matter.
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loader = inject(LoadingService);

  const skipViaContext = req.context.get(SKIP_LOADER);
  const skipViaHeader =
    req.headers.get(SKIP_LOADER_HEADER)?.toLowerCase() === 'true';

  if (skipViaContext || skipViaHeader) {
    const cleaned = skipViaHeader
      ? req.clone({ headers: req.headers.delete(SKIP_LOADER_HEADER) })
      : req;
    return next(cleaned);
  }

  loader.show();
  return next(req).pipe(finalize(() => loader.hide()));
};
