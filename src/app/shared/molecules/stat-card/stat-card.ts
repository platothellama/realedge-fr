import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

/**
 * Canonical stat-card molecule — consolidates the ~8 hand-rolled
 * `.stat-card > .stat-icon(.tone) + .stat-content > .stat-value + .stat-label`
 * copies (commissions, expenses, invoices, payments, marketing-automation,
 * commission-settings, market, finance, dashboard, sellers) into one primitive.
 *
 * The `tone` input maps 1:1 to the existing `.stat-icon.<tone>` color classes
 * (total, pending, approved, paid, this-month, …) so per-page coloring is
 * preserved. Uses the global `.stat-card` styles — no visual change.
 *
 * Two documented variants are supported without forking the markup:
 * - `layout="label-first"` for cards that render the label above the value
 *   (dashboard), vs the default `value-first`.
 * - `iconBackground` / `iconColor` passthroughs for cards whose icon colors
 *   are data-driven inline styles (dashboard); when empty, the `tone` class
 *   (or default icon styling) applies as before.
 */
@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="stat-card">
      <div class="stat-icon {{ tone }}" [style.background]="iconBackground || null" [style.color]="iconColor || null">
        <mat-icon aria-hidden="true" [style.color]="iconColor || null">{{ icon }}</mat-icon>
      </div>
      <div class="stat-content">
        @if (layout === 'label-first') {
          <span class="stat-label">{{ label }}</span>
          <span class="stat-value">{{ value }}</span>
        } @else {
          <span class="stat-value">{{ value }}</span>
          <span class="stat-label">{{ label }}</span>
        }
      </div>
    </div>
  `,
})
export class StatCardComponent {
  @Input() icon = 'insights';
  /** Accepts pre-formatted strings ("$45K") or raw numbers. */
  @Input() value: string | number = '';
  @Input() label = '';
  /** Existing `.stat-icon.<tone>` color class (total|pending|approved|paid|…). */
  @Input() tone = '';
  /** Label/value order variant. */
  @Input() layout: 'value-first' | 'label-first' = 'value-first';
  /** Inline icon background passthrough (data-driven colors). */
  @Input() iconBackground = '';
  /** Inline icon color passthrough (data-driven colors). */
  @Input() iconColor = '';
}
