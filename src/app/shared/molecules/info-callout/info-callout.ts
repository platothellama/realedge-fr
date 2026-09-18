import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

/**
 * Guidance callout (icon + title + hint) — consolidates the 5 identical
 * `.info-card.summary-card` hint boxes (one per property-form wizard step)
 * into one primitive. Purely presentational; global info-card styling
 * is preserved verbatim.
 */
@Component({
  selector: 'app-info-callout',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="info-card summary-card">
      <mat-icon aria-hidden="true">{{ icon }}</mat-icon>
      <div>
        <strong>{{ title }}</strong>
        <p>{{ text }}</p>
      </div>
    </div>
  `,
})
export class InfoCalloutComponent {
  @Input() icon = 'info';
  @Input() title = '';
  @Input() text = '';
}
