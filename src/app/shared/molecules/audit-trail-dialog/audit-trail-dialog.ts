import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface AuditEvent {
  createdAt: string;
  action: string;
  ipAddress?: string;
}

export interface AuditTrailData {
  title: string;
  events: AuditEvent[];
}

/** Accessible replacement for the native alert() audit-trail dump. */
@Component({
  selector: 'app-audit-trail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="audit-title">
      <mat-icon aria-hidden="true">history</mat-icon>
      Audit Trail — {{ data.title }}
    </h2>
    <mat-dialog-content>
      @if (data.events.length === 0) {
        <p class="audit-empty">No audit events recorded.</p>
      } @else {
        <ul class="audit-list">
          @for (event of data.events; track $index) {
            <li class="audit-item">
              <span class="audit-date">{{ event.createdAt | date: 'MMM d, yyyy h:mm a' }}</span>
              <span class="audit-action">{{ event.action }}</span>
              <span class="audit-ip">{{ event.ipAddress || 'N/A' }}</span>
            </li>
          }
        </ul>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-raised-button color="primary" (click)="close()" cdkFocusInitial>Close</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .audit-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 1.1rem;
      }
      .audit-empty {
        color: var(--text-secondary);
        margin: 0;
      }
      .audit-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .audit-item {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 10px 12px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--bg-elevated);
      }
      .audit-date {
        font-size: 0.75rem;
        color: var(--text-muted);
      }
      .audit-action {
        font-weight: 600;
      }
      .audit-ip {
        font-size: 0.8rem;
        color: var(--text-secondary);
      }
    `,
  ],
})
export class AuditTrailDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<AuditTrailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AuditTrailData
  ) {}

  close(): void {
    this.dialogRef.close();
  }
}
