import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

/**
 * Canonical shape for every error shown in the big global popup.
 * Built by the HTTP interceptor (server/API failures) and by the
 * global ErrorHandler (client-side crashes). Everything the support
 * team / AI assistant needs to fix the bug lives in `fullText`.
 */
export interface ErrorReport {
  /** Short unique id shown in the dialog header (for support tickets). */
  id: string;
  /** ISO timestamp of when the error was captured. */
  timestamp: string;
  /** Short human title, e.g. "Server error (500)". */
  title: string;
  /** One-line plain-language explanation shown at the top of the popup. */
  friendlyMessage: string;
  /** Where the error came from. */
  type: 'HTTP' | 'CLIENT';
  /** HTTP method for API errors (GET/POST/...). */
  method?: string;
  /** Request URL for API errors. */
  requestUrl?: string;
  /** HTTP status code (0 = network / CORS / server unreachable). */
  status?: number;
  /** HTTP status text. */
  statusText?: string;
  /** Best-effort server message (error.error.message etc.). */
  serverMessage?: string;
  /** Raw server body, truncated + stringified (max ~4k chars). */
  serverBody?: string;
  /** Angular route the user was on, e.g. "/properties". */
  route?: string;
  /** Logged-in user summary (id/email/role) when available. */
  user?: string;
  /** Browser + app context line. */
  context?: string;
  /** JS stack trace for client errors. */
  stack?: string;
  /** The exact copy-paste block for support / AI debugging. */
  fullText: string;
}

/** Marker set on errors already shown, so the global ErrorHandler doesn't double-popup. */
export const ERROR_ALREADY_REPORTED = '__realedgeErrorReported';

function safeStringify(value: unknown, max = 4000): string {
  try {
    const s = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    if (!s) return '(empty response body)';
    return s.length > max ? s.slice(0, max) + `\n… [truncated ${s.length - max} chars]` : s;
  } catch {
    return String(value ?? '(unserializable body)');
  }
}

function extractServerMessage(err: HttpErrorResponse): string {
  const body: any = err.error;
  if (typeof body === 'string' && body.trim()) return body.slice(0, 500);
  if (body && typeof body === 'object') {
    return (
      body.message ||
      body.error ||
      body.msg ||
      (Array.isArray(body.errors) ? body.errors.join('; ') : '') ||
      err.message ||
      err.statusText ||
      'Unknown server error'
    );
  }
  return err.message || err.statusText || 'Unknown server error';
}

function friendlyForStatus(status: number, serverMessage: string): { title: string; friendly: string } {
  switch (status) {
    case 0:
      return {
        title: 'Connection failed (network error)',
        friendly: 'Could not reach the server. Check your internet connection and that the backend is running, then try again.',
      };
    case 400:
      return { title: `Bad request (400)`, friendly: `The server rejected the request: ${serverMessage}` };
    case 401:
      return { title: 'Session expired (401)', friendly: 'Your session expired. You will be redirected to the login page.' };
    case 403:
      return { title: 'Access denied (403)', friendly: `You don't have permission for this action: ${serverMessage}` };
    case 404:
      return { title: 'Not found (404)', friendly: `The requested item or endpoint was not found: ${serverMessage}` };
    case 409:
      return { title: `Conflict (409)`, friendly: `This conflicts with existing data: ${serverMessage}` };
    case 422:
      return { title: 'Validation failed (422)', friendly: `Please fix the highlighted fields: ${serverMessage}` };
    case 429:
      return { title: 'Too many requests (429)', friendly: 'You are sending requests too fast. Wait a moment and try again.' };
    default:
      if (status >= 500)
        return { title: `Server error (${status})`, friendly: `Something broke on the server: ${serverMessage}. Copy the report below and send it to support.` };
      return { title: `Request failed (${status})`, friendly: serverMessage };
  }
}

/**
 * Central error-reporting service.
 *
 * - Builds a rich ErrorReport from HTTP or client errors.
 * - Opens the big full-detail popup (one at a time — duplicates suppressed).
 * - Exposes copy helpers (clipboard + fallback).
 *
 * Reads route/user from Router/localStorage directly (NOT via AuthService)
 * to avoid a DI cycle: AuthService -> HttpClient -> interceptors -> this service.
 */
@Injectable({ providedIn: 'root' })
export class ErrorReportService {
  private dialog = inject(MatDialog);
  private router = inject(Router);

  /** True while the big popup is open — prevents dialog spam on burst failures. */
  private dialogOpen = false;
  /** Last report signature + time, to dedupe identical errors within 2s. */
  private lastSignature = '';
  private lastShownAt = 0;

  // ---------------------------------------------------------------- build

  buildFromHttp(req: HttpRequest<unknown>, err: HttpErrorResponse): ErrorReport {
    const serverMessage = extractServerMessage(err);
    const { title, friendly } = friendlyForStatus(err.status, serverMessage);
    const id = this.newId();
    const timestamp = new Date().toISOString();
    const route = this.currentRoute();
    const user = this.currentUser();
    const context = this.contextLine();
    const serverBody = safeStringify(err.error);

    const fullText = [
      '===== REALEDGE ERROR REPORT (copy everything below) =====',
      `Report ID : ${id}`,
      `Time      : ${timestamp}`,
      `Page      : ${route}`,
      `User      : ${user}`,
      `Type      : HTTP ${req.method} ${req.url}`,
      `Status    : ${err.status} ${err.statusText || ''}`.trim(),
      `Message   : ${serverMessage}`,
      `Context   : ${context}`,
      '',
      '--- Server response body ---',
      serverBody,
      '',
      '--- What I was doing ---',
      '(please write 1 line here, e.g. "clicked Save on property page")',
      '===========================================================',
    ].join('\n');

    return {
      id, timestamp, title, friendlyMessage: friendly, type: 'HTTP',
      method: req.method, requestUrl: req.url,
      status: err.status, statusText: err.statusText,
      serverMessage, serverBody, route, user, context, fullText,
    };
  }

  buildFromClient(error: unknown): ErrorReport {
    const errObj = this.unwrap(error);
    const message = errObj?.message || String(error ?? 'Unknown error');
    const stack = (errObj?.stack as string | undefined) || new Error().stack || '(no stack available)';
    const id = this.newId();
    const timestamp = new Date().toISOString();
    const route = this.currentRoute();
    const user = this.currentUser();
    const context = this.contextLine();

    const fullText = [
      '===== REALEDGE ERROR REPORT (copy everything below) =====',
      `Report ID : ${id}`,
      `Time      : ${timestamp}`,
      `Page      : ${route}`,
      `User      : ${user}`,
      `Type      : CLIENT (frontend crash)`,
      `Message   : ${message}`,
      `Context   : ${context}`,
      '',
      '--- Stack trace ---',
      String(stack).slice(0, 6000),
      '',
      '--- What I was doing ---',
      '(please write 1 line here, e.g. "opened dashboard, page went blank")',
      '===========================================================',
    ].join('\n');

    return {
      id, timestamp,
      title: 'Something went wrong in the app',
      friendlyMessage: `${message}. Copy the report below and send it to support so it can be fixed.`,
      type: 'CLIENT', route, user, context, stack, serverMessage: message, fullText,
    };
  }

  /** Short, very explicit message the user pastes to support / AI. */
  supportMessage(report: ErrorReport): string {
    return [
      `Hi support, the app showed an error. Please fix it.`,
      ``,
      `Report ID: ${report.id}`,
      `Time: ${report.timestamp}`,
      `Page: ${report.route ?? '(unknown)'}`,
      `Error: ${report.title} — ${report.serverMessage ?? report.friendlyMessage}`,
      ...(report.type === 'HTTP'
        ? [`Request: ${report.method} ${report.requestUrl} (status ${report.status})`]
        : []),
      ``,
      `Full technical details are in the "Copy full report" text I pasted below this message.`,
    ].join('\n');
  }

  // ---------------------------------------------------------------- show

  /** Opens the big popup. Safe to call from anywhere; dedupes bursts. */
  async show(report: ErrorReport): Promise<void> {
    const signature = `${report.type}|${report.status ?? 0}|${report.requestUrl ?? ''}|${report.serverMessage ?? ''}`;
    const now = Date.now();
    if (signature === this.lastSignature && now - this.lastShownAt < 2000) return;
    if (this.dialogOpen) return;
    this.lastSignature = signature;
    this.lastShownAt = now;

    // eslint-disable-next-line no-console
    console.error(`[ErrorReport ${report.id}]`, report.fullText);

    // Lazy-load the dialog component so this service has no static
    // cycle with the component and keeps the initial bundle small.
    const { ErrorDialogComponent } = await import(
      '../../components/error-dialog/error-dialog'
    );
    this.dialogOpen = true;
    const ref = this.dialog.open(ErrorDialogComponent, {
      data: report,
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '92vh',
      panelClass: 'error-report-dialog',
      disableClose: false,
      autoFocus: false,
    });
    await ref.afterClosed().toPromise().catch(() => undefined);
    this.dialogOpen = false;
  }

  /** Fire-and-forget variant for interceptors / ErrorHandler (never throws). */
  showNonBlocking(report: ErrorReport): void {
    void this.show(report).catch((e) => console.error('Failed to show error dialog', e));
  }

  // ---------------------------------------------------------------- copy

  async copyText(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback for non-secure contexts / older browsers.
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
      } catch {
        return false;
      }
    }
  }

  // ---------------------------------------------------------------- private

  private newId(): string {
    return 'ERR-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  private currentRoute(): string {
    try {
      return this.router.url || location.pathname;
    } catch {
      return location.pathname;
    }
  }

  private currentUser(): string {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return '(not logged in)';
      const u = JSON.parse(raw);
      return `${u?.email ?? u?.id ?? 'unknown'}${u?.role ? ` (${u.role})` : ''}`;
    } catch {
      return '(unreadable session)';
    }
  }

  private contextLine(): string {
    try {
      return `${navigator.userAgent} | ${window.innerWidth}x${window.innerHeight} | ${location.href}`;
    } catch {
      return location.href;
    }
  }

  /** Unwraps Zone.js / promise-rejection wrappers to the real error. */
  private unwrap(error: unknown): any {
    let e: any = error;
    // Angular sometimes wraps: { rejection: ... } / { reason: ... } / ErrorEvent
    for (let i = 0; i < 3 && e; i++) {
      if (e instanceof Error) return e;
      if (e?.rejection) { e = e.rejection; continue; }
      if (e?.reason) { e = e.reason; continue; }
      if (e?.error instanceof Error) return e.error;
      break;
    }
    return e instanceof Error ? e : { message: String((e as any)?.message ?? e), stack: (e as any)?.stack };
  }
}
