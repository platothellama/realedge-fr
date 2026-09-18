import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

/**
 * Canonical page-header molecule — consolidates the ~22 hand-rolled
 * page headers (`page-header` / `header-section` + `header-content` /
 * `title-area` + actions) into one reusable primitive.
 *
 * Backwards-compatible class aliases (`header-section`, `title-area`,
 * `action-area`, `header-actions`) are rendered alongside the canonical
 * classes so both global and page-local CSS selectors keep matching.
 * Action buttons/menus/filters are projected via `<ng-content>`.
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="page-header header-section">
      @if (showBack) {
        <button
          mat-icon-button
          class="back-btn back-button"
          type="button"
          (click)="back.emit()"
          [attr.aria-label]="backLabel"
        >
          <mat-icon aria-hidden="true">arrow_back</mat-icon>
        </button>
      }
      <div class="header-content title-area page-header-content header-left">
        <h1 class="page-title">{{ title }}</h1>
        @if (subtitle) {
          <p class="page-subtitle">{{ subtitle }}</p>
        }
      </div>
      <div class="page-header-actions action-area header-actions">
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  /** Render the back button (detail/wizard pages). */
  @Input() showBack = false;
  @Input() backLabel = 'Go back';
  @Output() back = new EventEmitter<void>();
}
