import { Component, OnDestroy, effect, inject, signal, EffectRef } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoadingService } from '../../../services/loading/loading.service';

/**
 * Global blocking loader overlay.
 *
 * - Binds to LoadingService.isLoading() driven by `loadingInterceptor`.
 * - Covers the full viewport, blocks pointer interaction (no double-clicks
 *   / no navigation mid-request) and shows a spinner.
 * - Debounced (150ms): fast requests don't cause a visible flash.
 * - Accessible: role="status" + aria-live so screen readers announce it.
 *
 * Usage: place once in app.html: `<app-global-loader></app-global-loader>`
 */
@Component({
  selector: 'app-global-loader',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  templateUrl: './global-loader.html',
  styleUrl: './global-loader.css',
})
export class GlobalLoader implements OnDestroy {
  private readonly loader = inject(LoadingService);

  /** Debounced visibility — true only if loading persists past the delay. */
  readonly visible = signal(false);

  private showTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly stopEffect: EffectRef;

  /** Delay before the overlay appears (avoids flicker on fast calls). */
  static readonly SHOW_DELAY_MS = 150;

  constructor() {
    this.stopEffect = effect(() => {
      const loading = this.loader.isLoading();
      if (loading) {
        if (this.showTimer === null && !this.visible()) {
          this.showTimer = setTimeout(() => {
            // Re-check: request may have finished during the delay.
            if (this.loader.isLoading()) {
              this.visible.set(true);
            }
            this.showTimer = null;
          }, GlobalLoader.SHOW_DELAY_MS);
        }
      } else {
        if (this.showTimer !== null) {
          clearTimeout(this.showTimer);
          this.showTimer = null;
        }
        if (this.visible()) {
          this.visible.set(false);
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.showTimer !== null) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }
    this.stopEffect.destroy();
  }
}
