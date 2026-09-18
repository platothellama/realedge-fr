import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/**
 * Canonical loading-state atom — consolidates the ~29 hand-rolled
 * `<div class="loading-container"><mat-spinner></mat-spinner>[<p>…]</div>`
 * copies scattered across pages into one reusable primitive.
 * Uses the global `.loading-container` class so styling, responsive and
 * accessibility behavior (`role="status"`) are preserved.
 */
@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="loading-container" role="status" aria-live="polite">
      <mat-spinner [diameter]="diameter"></mat-spinner>
      @if (message) {
        <p>{{ message }}</p>
      }
    </div>
  `,
})
export class LoadingStateComponent {
  /** Optional text under the spinner (e.g. "Loading commissions…"). */
  @Input() message = '';
  /** Spinner diameter — pages uniformly used 40 (50 in property-matcher). */
  @Input() diameter = 40;
}
