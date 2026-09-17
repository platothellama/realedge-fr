import { Injectable, computed, signal } from '@angular/core';

/**
 * Global loading state driven by the HTTP loading interceptor.
 *
 * - `show()` increments the pending-request counter.
 * - `hide()` decrements it (never below 0).
 * - `isLoading` is true while at least one tracked request is in flight.
 * - `pendingRequests` exposes the raw count (useful for debugging/tests).
 *
 * The counter approach handles concurrent API calls correctly:
 * the overlay only disappears when the LAST tracked call finishes.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly activeCount = signal(0);

  /** True while any tracked HTTP request is in flight. */
  readonly isLoading = computed(() => this.activeCount() > 0);

  /** Raw number of in-flight tracked requests. */
  readonly pendingRequests = this.activeCount.asReadonly();

  show(): void {
    this.activeCount.update((n) => n + 1);
  }

  hide(): void {
    this.activeCount.update((n) => (n > 0 ? n - 1 : 0));
  }

  /** Force-reset (e.g. on logout / fatal error so the UI never sticks). */
  reset(): void {
    this.activeCount.set(0);
  }
}
