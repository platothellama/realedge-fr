import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-sold-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <div class="sold-dialog">
      <div class="dialog-header">
        <mat-icon>check_circle</mat-icon>
        <h2>Mark as Sold</h2>
      </div>

      <mat-dialog-content>
        <form [formGroup]="soldForm">
          <mat-radio-group formControlName="selectionType" class="selection-type">
            <mat-radio-button value="deal">Select Existing Deal</mat-radio-button>
            <mat-radio-button value="newDeal">Create New Deal</mat-radio-button>
            <mat-radio-button value="existing">Select Existing Lead</mat-radio-button>
            <mat-radio-button value="new">Create New Lead</mat-radio-button>
          </mat-radio-group>

          @if (soldForm.get('selectionType')?.value === 'deal') {
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Select Deal</mat-label>
              <mat-select formControlName="dealId">
                @for (deal of deals; track deal.id) {
                  <mat-option [value]="deal.id">
                    {{ deal.title }} - {{ deal.buyerName }}
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>
          }

          @if (soldForm.get('selectionType')?.value === 'newDeal') {
            <div class="new-deal-fields">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Deal Title</mat-label>
                <input matInput formControlName="dealTitle" placeholder="Deal title">
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Buyer Name</mat-label>
                <input matInput formControlName="buyerName" placeholder="Buyer name">
              </mat-form-field>
            </div>
          }

          @if (soldForm.get('selectionType')?.value === 'existing') {
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Select Buyer (Lead)</mat-label>
              <mat-select formControlName="leadId">
                @for (lead of leads; track lead.id) {
                  <mat-option [value]="lead.id">
                    {{ lead.name }} - {{ lead.email }}
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>
          }

          @if (soldForm.get('selectionType')?.value === 'new') {
            <div class="new-lead-fields">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Name</mat-label>
                <input matInput formControlName="name" placeholder="Buyer name">
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email" type="email" placeholder="buyer@email.com">
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Phone</mat-label>
                <input matInput formControlName="phone" placeholder="+971 50 123 4567">
              </mat-form-field>
            </div>
          }

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Sale Date</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="soldAt">
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button mat-raised-button color="primary" [disabled]="soldForm.invalid" (click)="onSubmit()">
          Mark as Sold
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .sold-dialog {
      min-width: 400px;
    }
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }
    .dialog-header mat-icon {
      color: #16a34a;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    .dialog-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 500;
    }
    .selection-type {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
    }
    .full-width {
      width: 100%;
      margin-bottom: 12px;
    }
    .new-lead-fields, .new-deal-fields {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }
  `]
})
export class SoldDialogComponent implements OnInit {
  soldForm: FormGroup;
  leads: any[] = [];
  deals: any[] = [];
  currentUser: any = null;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private dialogRef: MatDialogRef<SoldDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.leads = data.leads || [];

    this.soldForm = this.fb.group({
      selectionType: ['deal', Validators.required],
      dealId: [null],
      dealTitle: [''],
      buyerName: [''],
      leadId: [null],
      name: [''],
      email: [''],
      phone: [''],
      soldAt: [new Date(), Validators.required]
    });
  }

  ngOnInit() {
    this.api.getDeals().subscribe({
      next: (res: any) => {
        const allDeals = Array.isArray(res) ? res : (res?.data || []);
        this.deals = allDeals.filter((d: any) => d.propertyId === this.data.propertyId);
      },
      error: (err) => console.error('Error loading deals', err)
    });

    this.api.getMe().subscribe(user => {
      this.currentUser = user;
    });

    this.soldForm.get('selectionType')?.valueChanges.subscribe(value => {
      this.soldForm.get('dealId')?.clearValidators();
      this.soldForm.get('dealTitle')?.clearValidators();
      this.soldForm.get('buyerName')?.clearValidators();
      this.soldForm.get('leadId')?.clearValidators();
      this.soldForm.get('name')?.clearValidators();
      this.soldForm.get('email')?.clearValidators();
      this.soldForm.get('phone')?.clearValidators();

      if (value === 'deal') {
        this.soldForm.get('dealId')?.setValidators([Validators.required]);
      } else if (value === 'newDeal') {
        this.soldForm.get('dealTitle')?.setValidators([Validators.required]);
        this.soldForm.get('buyerName')?.setValidators([Validators.required]);
      } else if (value === 'existing') {
        this.soldForm.get('leadId')?.setValidators([Validators.required]);
      } else if (value === 'new') {
        this.soldForm.get('name')?.setValidators([Validators.required]);
        this.soldForm.get('email')?.setValidators([Validators.required, Validators.email]);
        this.soldForm.get('phone')?.setValidators([Validators.required]);
      }

      this.soldForm.get('dealId')?.updateValueAndValidity();
      this.soldForm.get('dealTitle')?.updateValueAndValidity();
      this.soldForm.get('buyerName')?.updateValueAndValidity();
      this.soldForm.get('leadId')?.updateValueAndValidity();
      this.soldForm.get('name')?.updateValueAndValidity();
      this.soldForm.get('email')?.updateValueAndValidity();
      this.soldForm.get('phone')?.updateValueAndValidity();
    });
  }

  onSubmit() {
    if (this.soldForm.valid) {
      const formValue = this.soldForm.getRawValue();
      const soldAt = formValue.soldAt.toISOString();

      if (formValue.selectionType === 'deal') {
        const selectedDeal = this.deals.find(d => d.id === formValue.dealId);
        this.dialogRef.close({
          dealId: formValue.dealId,
          dealTitle: selectedDeal?.title,
          buyerName: selectedDeal?.buyerName,
          soldAt: soldAt
        });
      } else if (formValue.selectionType === 'newDeal') {
        this.dialogRef.close({
          createNewDeal: true,
          newDeal: {
            title: formValue.dealTitle,
            buyerName: formValue.buyerName,
            dealStage: 'Closed',
            propertyId: this.data.propertyId,
            brokerId: this.currentUser?.id
          },
          soldAt: soldAt
        });
      } else if (formValue.selectionType === 'existing') {
        const selectedLead = this.leads.find(l => l.id === formValue.leadId);
        this.dialogRef.close({
          leadId: formValue.leadId,
          leadName: selectedLead?.name,
          soldAt: soldAt
        });
      } else {
        this.dialogRef.close({
          createNewLead: true,
          newLead: {
            name: formValue.name,
            email: formValue.email,
            phone: formValue.phone,
            source: 'Property Sale',
            status: 'Closed',
            propertyId: this.data.propertyId,
            budget: 0
          },
          soldAt: soldAt
        });
      }
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
