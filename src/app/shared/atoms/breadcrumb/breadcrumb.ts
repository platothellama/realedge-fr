import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

export interface Crumb {
  label: string;
  link?: string;
}

/** Lightweight breadcrumb for deeply nested detail pages. */
@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      @for (crumb of items; track crumb.label; let last = $last) {
        @if (crumb.link && !last) {
          <a [routerLink]="crumb.link">{{ crumb.label }}</a>
          <mat-icon aria-hidden="true">chevron_right</mat-icon>
        } @else {
          <span aria-current="page">{{ crumb.label }}</span>
        }
      }
    </nav>
  `,
})
export class BreadcrumbComponent {
  @Input() items: Crumb[] = [];
}
