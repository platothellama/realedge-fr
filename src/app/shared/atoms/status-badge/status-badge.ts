import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getStatusBadgeClass } from '../../utils/status';

/**
 * Canonical status badge atom — consolidates the 12+ page-local
 * getStatusClass copies into one tested primitive.
 *
 * `label` overrides the displayed text (pages with local label maps pass
 * their mapped label); `toneClass` appends an extra page-local tone class
 * where a page still needs its legacy color. New code should rely on the
 * canonical map + global `.badge-*` classes only.
 */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="status-badge" [ngClass]="[badgeClass, toneClass]">{{ displayLabel }}</span>`,
})
export class StatusBadgeComponent {
  @Input() status = '';
  @Input() label = '';
  @Input() toneClass = '';

  get badgeClass(): string {
    return getStatusBadgeClass(this.status);
  }

  get displayLabel(): string {
    return this.label || this.status;
  }
}
