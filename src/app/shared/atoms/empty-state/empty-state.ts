import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/** Shared empty state — consistent icon + title + hint + CTA.
 * `small` renders the compact `.empty-state.small` variant (48px icon,
 * tighter padding) for in-card placeholders such as dashboard widgets. */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="empty-state" [class.small]="small">
      <mat-icon>{{ icon }}</mat-icon>
      <h3>{{ title }}</h3>
      @if (hint) {
        <p>{{ hint }}</p>
      }
      @if (actionLabel) {
        <button mat-raised-button color="primary" (click)="action.emit()">
          {{ actionLabel }}
        </button>
      }
      <ng-content></ng-content>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = 'Nothing here yet';
  @Input() hint = '';
  @Input() actionLabel = '';
  @Input() small = false;
  @Output() action = new EventEmitter<void>();
}
