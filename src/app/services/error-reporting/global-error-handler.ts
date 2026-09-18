import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ERROR_ALREADY_REPORTED, ErrorReportService } from './error-report.service';

/**
 * GLOBAL client-error handler — catches EVERY uncaught frontend crash on
 * EVERY page (template errors, TypeErrors, failed promises, chunk-load
 * failures...) and shows the same big copy-paste popup as API errors.
 *
 * Registered in app.config.ts as `{ provide: ErrorHandler, useClass: GlobalErrorHandler }`.
 *
 * - HTTP errors already shown by errorInterceptor carry the
 *   ERROR_ALREADY_REPORTED flag and are NOT shown twice.
 * - Chunk-load failures (new deploy) get a friendly reload hint.
 * - Uses Injector.get() lazily to avoid a construction-time DI cycle.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(error: unknown): void {
    // Always keep the console trace for devtools.
    // eslint-disable-next-line no-console
    console.error('[GlobalErrorHandler]', error);

    try {
      // Already popped by the HTTP interceptor? Don't double-popup.
      if ((error as any)?.[ERROR_ALREADY_REPORTED]) return;
      const rejection = (error as any)?.rejection;
      if (rejection?.[ERROR_ALREADY_REPORTED]) return;

      // Unwrap the real cause for classification.
      const cause = rejection ?? (error as any)?.reason ?? error;

      // HTTP errors that escaped without the interceptor flag (e.g. thrown
      // manually): mark + skip 401s (session redirect), show the rest.
      if (cause instanceof HttpErrorResponse) {
        if (cause.status === 401) return;
        (cause as any)[ERROR_ALREADY_REPORTED] = true;
        (error as any)[ERROR_ALREADY_REPORTED] = true;
      }

      // Never break boot: if the error happens before DI is ready, bail out.
      let reports: ErrorReportService;
      try {
        reports = this.injector.get(ErrorReportService);
      } catch {
        return;
      }

      const report = reports.buildFromClient(error);

      // Chunk-load failure = stale bundle after a new deploy. Tell the user
      // the one action that actually fixes it.
      if (/Loading chunk|ChunkLoadError|Failed to fetch dynamically imported module/i.test(
        `${report.serverMessage} ${report.stack ?? ''}`,
      )) {
        report.title = 'New version available — please reload';
        report.friendlyMessage =
          'The app was just updated. Please reload the page (Ctrl+F5). If the error persists, copy the report below and send it to support.';
      }

      reports.showNonBlocking(report);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('GlobalErrorHandler: failed to report error', e);
    }
  }
}
