import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Shared error state with retry — previously fetch failures only
 * surfaced as transient snackbars with no inline recovery.
 */
@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="error-state" role="alert">
      <mat-icon>error_outline</mat-icon>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <button mat-raised-button color="primary" (click)="retry.emit()">
        <mat-icon>refresh</mat-icon> Try again
      </button>
    </div>
  `,
})
export class ErrorStateComponent {
  @Input() title = "Couldn't load data";
  @Input() message = 'Check your connection and try again.';
  @Output() retry = new EventEmitter<void>();
}
