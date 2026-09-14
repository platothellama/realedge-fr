import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

/**
 * Centralized toast notifications — replaces ad-hoc
 * `snackBar.open(msg, 'Close', { duration })` strings scattered
 * across ~15 files. Consistent duration, action label, and
 * error styling (previously only one `error-snackbar` usage).
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private snackBar = inject(MatSnackBar);

  private base: MatSnackBarConfig = {
    horizontalPosition: 'end',
    verticalPosition: 'bottom',
  };

  success(message: string, action = 'Dismiss', duration = 3500): void {
    this.snackBar.open(message, action, { ...this.base, duration });
  }

  info(message: string, action = 'Dismiss', duration = 3500): void {
    this.snackBar.open(message, action, { ...this.base, duration });
  }

  error(message: string, action = 'Dismiss', duration = 5000): void {
    this.snackBar.open(message, action, {
      ...this.base,
      duration,
      panelClass: ['error-snackbar'],
    });
  }
}
