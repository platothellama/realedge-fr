import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

export interface LostDialogResult {
  reason: string;
  date: string;
}

/** Accessible replacement for the native prompt() lost-reason flow. */
@Component({
  selector: 'app-lost-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  template: `
    <div class="lost-dialog">
      <div class="dialog-header">
        <mat-icon aria-hidden="true">cancel</mat-icon>
        <h2>Mark as Lost</h2>
      </div>
      <mat-dialog-content>
        <form [formGroup]="lostForm">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Reason for losing</mat-label>
            <input matInput formControlName="reason" placeholder="e.g. price, competitor, timing" />
            @if (lostForm.get('reason')?.hasError('required') && lostForm.get('reason')?.touched) {
              <mat-error>A reason is required</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Date</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="date" />
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>
        </form>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button
          mat-raised-button
          color="warn"
          [disabled]="lostForm.invalid"
          (click)="onSubmit()"
          cdkFocusInitial
        >
          Mark as Lost
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .lost-dialog {
        width: 100%;
        max-width: 440px;
      }
      .dialog-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
      }
      .dialog-header mat-icon {
        color: var(--error);
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
      .dialog-header h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 500;
      }
      .full-width {
        width: 100%;
        margin-bottom: 8px;
      }
    `,
  ],
})
export class LostDialogComponent {
  lostForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<LostDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { propertyTitle?: string },
    private fb: FormBuilder
  ) {
    this.lostForm = this.fb.group({
      reason: ['', Validators.required],
      date: [new Date(), Validators.required],
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.lostForm.invalid) {
      this.lostForm.markAllAsTouched();
      return;
    }
    const { reason, date } = this.lostForm.value;
    const iso = date instanceof Date ? date.toISOString().split('T')[0] : date;
    const result: LostDialogResult = { reason: reason.trim(), date: iso };
    this.dialogRef.close(result);
  }
}
