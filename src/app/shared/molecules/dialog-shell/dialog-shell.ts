import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { A11yModule } from '@angular/cdk/a11y';

/**
 * Canonical dialog-shell molecule — consolidates the 13 hand-rolled
 * `dialog-overlay > dialog-content > dialog-header` scaffolds (tasks,
 * announcements, expenses, groups ×3, invoices, marketing-automation,
 * payments ×2, website-builder ×2, buyer-preferences) into one primitive.
 *
 * The shell owns ONLY the ambience + chrome that is identical everywhere:
 * overlay (click-outside + Escape dismiss), content box (role/aria/focus
 * trap) and header (title + close button). Body + footer markup stays
 * projected verbatim in the page template, so per-dialog forms, footer
 * classes (`dialog-footer` / `dialog-actions` / `modal-footer`), buttons
 * and validation wiring are preserved exactly — including `<form>` blocks
 * that wrap body + footer (all projected content stays in page scope, so
 * page-local body/footer CSS keeps matching).
 *
 * Deliberate micro-fixes vs the legacy copies (documented in refactor
 * report): buyer-preferences' modal previously had no Escape handler and
 * no role/aria attributes — the shell provides both, matching the other
 * 12 dialogs.
 */
@Component({
  selector: 'app-dialog-shell',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, A11yModule],
  template: `
    <div class="dialog-overlay" (click)="closed.emit()" (keydown.escape)="closed.emit()">
      <div
        class="dialog-content"
        [ngClass]="contentClass"
        (click)="$event.stopPropagation()"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
        [cdkTrapFocus]="trapFocus"
      >
        <div class="dialog-header">
          <h2 [id]="titleId"><ng-content select="[dialog-title-icon]"></ng-content>{{ title }}</h2>
          <button mat-icon-button type="button" (click)="closed.emit()" aria-label="Close dialog">
            <mat-icon aria-hidden="true">close</mat-icon>
          </button>
        </div>
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class DialogShellComponent {
  private static nextId = 0;

  /** Header text. Accepts bindings for dynamic titles (Edit vs New). */
  @Input() title = '';
  /** Preserves each dialog's original aria-labelledby id. Auto-unique. */
  @Input() titleId = `app-dialog-title-${DialogShellComponent.nextId++}`;
  /** Size modifiers, e.g. 'invoice-dialog' (700px) or 'dialog-large' (800px). */
  @Input() contentClass: string | string[] = '';
  /** Opt-in focus trap (expenses, invoices, payments, tasks use it). */
  @Input() trapFocus = false;
  @Output() closed = new EventEmitter<void>();
}
