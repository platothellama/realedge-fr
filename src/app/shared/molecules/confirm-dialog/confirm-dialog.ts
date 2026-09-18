import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

/**
 * Shared destructive-action confirmation — prevents accidental data loss.
 * Usage: dialog.open(ConfirmDialogComponent, { data: { title, message } })
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="confirm-title">
      <mat-icon [class.destructive]="data.destructive ?? true">{{
        (data.destructive ?? true) ? 'warning' : 'help_outline'
      }}</mat-icon>
      {{ data.title || 'Are you sure?' }}
    </h2>
    <mat-dialog-content>
      <p class="confirm-message">{{ data.message || 'This action cannot be undone.' }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">{{ data.cancelLabel || 'Cancel' }}</button>
      <button
        mat-raised-button
        [color]="(data.destructive ?? true) ? 'warn' : 'primary'"
        (click)="confirm()"
        cdkFocusInitial
      >
        {{ data.confirmLabel || 'Delete' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .confirm-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 1.15rem;
      }
      .confirm-title mat-icon {
        color: var(--warning);
      }
      .confirm-title mat-icon.destructive {
        color: var(--error);
      }
      .confirm-message {
        color: var(--text-secondary);
        margin: 0;
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
