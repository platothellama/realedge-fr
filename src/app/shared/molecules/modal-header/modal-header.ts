import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';

/**
 * Canonical MatDialog form header — consolidates the 6 identical
 * `.modal-header > h2[mat-dialog-title] + p.modal-subtitle` blocks
 * (deal, lead, visit, negotiation, document-upload, lead-workflow forms)
 * into one primitive. Preserves the `mat-dialog-title` directive (dialog
 * a11y semantics) and the global `.modal-header` styling.
 * (property-form uses a richer icon + step-counter header — intentionally
 * separate; group/user forms use a bare h2 with no subtitle — also kept.)
 */
@Component({
  selector: 'app-modal-header',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  template: `
    <div class="modal-header">
      <h2 mat-dialog-title>{{ title }}</h2>
      @if (subtitle) {
        <p class="modal-subtitle">{{ subtitle }}</p>
      }
    </div>
  `,
})
export class ModalHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
}
