import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/** QA 2026-09-18: unknown URLs land here instead of a silent dashboard redirect. */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterModule, MatButtonModule, MatIconModule],
  template: `
    <div class="not-found" style="text-align:center;padding:64px 16px">
      <mat-icon style="font-size:48px;width:48px;height:48px">search_off</mat-icon>
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist or was moved.</p>
      <a mat-raised-button color="primary" routerLink="/dashboard">Back to dashboard</a>
    </div>
  `,
})
export class NotFoundComponent {}
