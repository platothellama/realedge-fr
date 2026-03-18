import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-visit-form',
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
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './visit-form.html',
  styleUrl: './visit-form.css'
})
export class VisitFormComponent implements OnInit {
  visitForm: FormGroup;
  isEdit = false;
  properties: any[] = [];
  brokers: any[] = [];
  statuses = ['Scheduled', 'Completed', 'Cancelled', 'No Show'];

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private dialogRef: MatDialogRef<VisitFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.visitForm = this.fb.group({
      title: ['', Validators.required],
      visitDate: [new Date(), Validators.required],
      visitTime: ['10:00', Validators.required],
      clientName: ['', Validators.required],
      clientEmail: ['', [Validators.email]],
      clientPhone: [''],
      status: ['Scheduled', Validators.required],
      propertyId: [null, Validators.required],
      brokerId: [null, Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
    if (this.data && this.data.visit) {
      this.isEdit = true;
      const v = this.data.visit;
      // Extract time from visitDate
      const date = new Date(v.visitDate);
      const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      
      this.visitForm.patchValue({
        ...v,
        visitDate: date,
        visitTime: time
      });
    } else if (this.data && this.data.propertyId) {
      this.visitForm.get('propertyId')?.setValue(this.data.propertyId);
    }
  }

  private loadInitialData() {
    this.api.getProperties().subscribe(res => this.properties = res);
    this.api.getUsers().subscribe(res => this.brokers = res.data || res);
    
    this.api.getMe().subscribe(user => {
      if (!this.isEdit && !this.visitForm.get('brokerId')?.value) {
        this.visitForm.get('brokerId')?.setValue(user.id);
      }
    });
  }

  onSubmit(): void {
    if (this.visitForm.valid) {
      const val = this.visitForm.value;
      // Combine date and time
      const date = new Date(val.visitDate);
      const [hours, minutes] = val.visitTime.split(':');
      date.setHours(parseInt(hours), parseInt(minutes));
      
      const payload = {
        ...val,
        visitDate: date.toISOString()
      };
      delete payload.visitTime;
      
      this.dialogRef.close(payload);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
