import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ErrorReport, ErrorReportService } from '../../services/error-reporting/error-report.service';

/**
 * BIG global error popup shown for EVERY error (all pages).
 *
 * - Full technical details visible + selectable (no hidden info).
 * - "Copy full report" -> paste to the AI dev / support to fix the bug.
 * - "Copy support message" -> very explicit short message for support.
 */
@Component({
  selector: 'app-error-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="err-header">
      <div class="err-icon"><mat-icon>error</mat-icon></div>
      <div class="err-titles">
        <h2 mat-dialog-title>{{ data.title }}</h2>
        <div class="err-meta">
          <span class="err-id">{{ data.id }}</span>
          <span class="err-dot">•</span>
          <span>{{ data.timestamp }}</span>
        </div>
      </div>
      <button mat-icon-button (click)="close()" aria-label="Close error dialog">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="err-content">
      <!-- Plain-language banner -->
      <div class="err-friendly" role="alert">
        <mat-icon>info</mat-icon>
        <p>{{ data.friendlyMessage }}</p>
      </div>

      <!-- VERY CLEAR support instructions -->
      <div class="err-support-box">
        <div class="err-support-head">
          <mat-icon>support_agent</mat-icon>
          <strong>Copy &amp; paste this to support 👇</strong>
          <span class="spacer"></span>
          <button mat-raised-button color="primary" (click)="copySupport()">
            <mat-icon>{{ supportCopied() ? 'check' : 'content_copy' }}</mat-icon>
            {{ supportCopied() ? 'Copied!' : 'Copy support message' }}
          </button>
        </div>
        <pre class="err-pre selectable">{{ supportText }}</pre>
      </div>

      <!-- Key facts grid -->
      <div class="err-grid">
        <div><span>Page</span><strong>{{ data.route || '—' }}</strong></div>
        <div><span>User</span><strong>{{ data.user || '—' }}</strong></div>
        <div *ngIf="data.type === 'HTTP'"><span>Request</span><strong>{{ data.method }} {{ data.requestUrl }}</strong></div>
        <div *ngIf="data.type === 'HTTP'"><span>Status</span><strong>{{ data.status }} {{ data.statusText || '' }}</strong></div>
        <div class="full"><span>Message</span><strong>{{ data.serverMessage || '—' }}</strong></div>
      </div>

      <!-- Full technical dump (selectable, scrollable) -->
      <details class="err-details" open>
        <summary>Full technical details (for the developer / AI fix)</summary>
        <pre class="err-pre err-full selectable">{{ data.fullText }}</pre>
        <pre *ngIf="data.stack" class="err-pre selectable">{{ data.stack }}</pre>
      </details>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="err-actions">
      <button mat-button (click)="close()">Close</button>
      <button mat-stroked-button (click)="copySupport()">
        <mat-icon>{{ supportCopied() ? 'check' : 'content_copy' }}</mat-icon>
        {{ supportCopied() ? 'Copied!' : 'Copy support message' }}
      </button>
      <button mat-raised-button color="warn" (click)="copyFull()">
        <mat-icon>{{ fullCopied() ? 'check' : 'content_paste' }}</mat-icon>
        {{ fullCopied() ? 'Copied!' : 'Copy FULL report' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .err-header { display: flex; align-items: flex-start; gap: 14px; padding: 20px 24px 0; }
    .err-icon {
      width: 48px; height: 48px; min-width: 48px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(239,68,68,.14); color: var(--error);
    }
    .err-icon mat-icon { font-size: 28px; width: 28px; height: 28px; }
    .err-titles { flex: 1; min-width: 0; }
    .err-titles h2 { margin: 0; font-size: 1.25rem; font-weight: 800; line-height: 1.3; }
    .err-meta { color: var(--text-muted); font-size: .8rem; margin-top: 4px; display: flex; gap: 8px; flex-wrap: wrap; }
    .err-id { font-weight: 800; color: var(--warning); letter-spacing: .04em; }
    .err-dot { opacity: .5; }
    .err-content { display: flex; flex-direction: column; gap: 16px; }
    .err-friendly {
      display: flex; gap: 10px; align-items: flex-start;
      background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.3);
      border-radius: 12px; padding: 12px 14px;
    }
    .err-friendly mat-icon { color: var(--error); flex-shrink: 0; margin-top: 2px; }
    .err-friendly p { margin: 0; color: var(--text-primary); font-size: .95rem; }
    .err-support-box {
      border: 2px dashed var(--primary); border-radius: 12px; padding: 12px;
      background: rgba(99,102,241,.07);
    }
    .err-support-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
    .err-support-head mat-icon { color: var(--primary-bright); }
    .err-support-head strong { font-size: .95rem; }
    .err-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
      background: rgba(255,255,255,.02); border: 1px solid var(--border);
      border-radius: 12px; padding: 12px 14px;
    }
    .err-grid div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .err-grid div.full { grid-column: 1 / -1; }
    .err-grid span { font-size: .68rem; text-transform: uppercase; letter-spacing: .1em; color: var(--text-muted); font-weight: 800; }
    .err-grid strong { font-size: .85rem; font-weight: 600; word-break: break-word; }
    .err-details { border: 1px solid var(--border); border-radius: 12px; padding: 10px 12px; background: #0a0a0c; }
    .err-details summary { cursor: pointer; font-weight: 700; font-size: .85rem; padding: 4px; }
    .err-pre {
      white-space: pre-wrap; word-break: break-word; font-family: ui-monospace, Consolas, monospace;
      font-size: .78rem; line-height: 1.5; color: #d6e2f0;
      background: #0a0a0c; border: 1px solid var(--border); border-radius: 8px;
      padding: 12px; margin: 10px 0 0; max-height: 320px; overflow: auto;
    }
    .err-full { border-color: rgba(245,158,11,.4); }
    .selectable { user-select: text; }
    .err-actions { gap: 8px; flex-wrap: wrap; }
    @media (max-width: 640px) { .err-grid { grid-template-columns: 1fr; } }
  `],
})
export class ErrorDialogComponent {
  supportCopied = signal(false);
  fullCopied = signal(false);
  supportText = '';

  constructor(
    public dialogRef: MatDialogRef<ErrorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ErrorReport,
    private reports: ErrorReportService,
  ) {
    this.supportText = this.reports.supportMessage(data);
  }

  async copySupport(): Promise<void> {
    const ok = await this.reports.copyText(
      `${this.supportText}\n\n----- FULL REPORT -----\n${this.data.fullText}`,
    );
    if (ok) {
      this.supportCopied.set(true);
      setTimeout(() => this.supportCopied.set(false), 2000);
    }
  }

  async copyFull(): Promise<void> {
    const ok = await this.reports.copyText(this.data.fullText);
    if (ok) {
      this.fullCopied.set(true);
      setTimeout(() => this.fullCopied.set(false), 2000);
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
