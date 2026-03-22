import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-negotiation-form',
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
    MatCheckboxModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './negotiation-form.html',
  styleUrl: './negotiation-form.css'
})
export class NegotiationFormComponent implements OnInit {
  negotiationForm: FormGroup;
  leads: any[] = [];
  propertyPrice: number = 0;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private dialogRef: MatDialogRef<NegotiationFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.propertyPrice = this.data.propertyPrice || 0;
    
    this.negotiationForm = this.fb.group({
      price: [this.propertyPrice, [Validators.required, Validators.min(0)]],
      leadId: [null],
      note: ['', Validators.required],
      updatePropertyPrice: [false]
    });
  }

  ngOnInit(): void {
    this.apiService.getLeads().subscribe({
      next: (res: any) => {
        this.leads = Array.isArray(res) ? res : (res?.data || []);
      },
      error: (err) => {
        console.error('Error fetching leads:', err);
        this.leads = [];
      }
    });
  }

  onSubmit(): void {
    if (this.negotiationForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.dialogRef.close(this.negotiationForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
