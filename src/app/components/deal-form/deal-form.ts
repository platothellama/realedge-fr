import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-deal-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './deal-form.html',
  styleUrl: './deal-form.css'
})
export class DealFormComponent implements OnInit {
  dealForm: FormGroup;
  isEdit = false;
  properties: any[] = [];
  brokers: any[] = [];
  leads: any[] = [];
  currentUser: any = null;
  isAdmin = false;

  stages = ['Offer Made', 'Negotiation', 'Contract Signed', 'Payment', 'Closed'];

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private dialogRef: MatDialogRef<DealFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.dealForm = this.fb.group({
      title: ['', Validators.required],
      buyerName: ['', Validators.required],
      sellerName: ['', Validators.required],
      commission: [{ value: 0, disabled: true }, [Validators.required, Validators.min(0)]],
      dealStage: ['Offer Made', Validators.required],
      notes: [''],
      propertyId: ['', Validators.required],
      brokerId: [null, Validators.required],
      buyerLeadId: [null]
    });
  }

  ngOnInit(): void {
    this.loadInitialData();

    if (this.data && this.data.deal) {
      this.isEdit = true;
      this.dealForm.patchValue(this.data.deal);
    }
  }

  private loadInitialData() {
    // Check user role for commission editing
    this.api.getMe().subscribe(user => {
      this.currentUser = user;
      this.isAdmin = user.role === 'Super Admin' || user.role === 'Admin';

      if (this.isAdmin) {
        this.dealForm.get('commission')?.enable();
      }

      // Default broker to current user if not editing
      if (!this.isEdit) {
        this.dealForm.get('brokerId')?.setValue(user.id);
      }
    });

    this.api.getProperties().subscribe(res => {
      this.properties = res;
      // If editing or pre-selected, trigger calculation
      const selectedId = this.dealForm.get('propertyId')?.value;
      if (selectedId) this.calculateCommission(selectedId);
    });
    this.api.getUsers().subscribe(res => this.brokers = res.data || res);
    this.api.getLeads().subscribe(res => this.leads = res);

    // Watch for property selection changes
    this.dealForm.get('propertyId')?.valueChanges.subscribe(id => {
      if (id) this.calculateCommission(id);
    });
  }

  private calculateCommission(propertyId: string) {
    const property = this.properties.find(p => p.id === propertyId);
    if (property && property.commissionPercentage > 0) {
      const calculated = (Number(property.price) * property.commissionPercentage) / 100;
      this.dealForm.get('commission')?.setValue(calculated);
    }
  }

  onSubmit(): void {
    if (this.dealForm.valid) {
      // Include disabled fields in the value
      const val = this.dealForm.getRawValue();
      this.dialogRef.close(val);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
