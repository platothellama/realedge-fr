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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api';
import { ClientSelectorComponent, ClientSelection } from '../client-selector/client-selector';

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
    MatNativeDateModule,
    MatProgressSpinnerModule,
    ClientSelectorComponent
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
  isSubmitting = false;
  selectedClient: ClientSelection | null = null;

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
      const date = new Date(v.visitDate);
      const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      
      this.visitForm.patchValue({
        title: v.title,
        visitDate: date,
        visitTime: time,
        status: v.status,
        propertyId: v.propertyId,
        brokerId: v.brokerId,
        notes: v.notes
      });
      
      this.selectedClient = {
        leadId: v.leadId || null,
        createNew: !v.leadId,
        client: {
          name: v.clientName || '',
          email: v.clientEmail || '',
          phone: v.clientPhone || ''
        }
      };
    } else if (this.data && this.data.propertyId) {
      this.visitForm.get('propertyId')?.setValue(this.data.propertyId);
    }
  }

  private loadInitialData() {
    this.api.getProperties().subscribe(res => {
      this.properties = Array.isArray(res) ? res : (res.data || []);
    });
    this.api.getUsers().subscribe(res => {
      this.brokers = Array.isArray(res) ? res : (res.data || []);
    });
    
    this.api.getMe().subscribe(user => {
      if (!this.isEdit && !this.visitForm.get('brokerId')?.value) {
        this.visitForm.get('brokerId')?.setValue(user.id);
      }
    });
  }

  onSubmit(): void {
    if (this.visitForm.valid && !this.isSubmitting && this.selectedClient) {
      this.isSubmitting = true;
      const val = this.visitForm.value;
      const date = new Date(val.visitDate);
      const [hours, minutes] = val.visitTime.split(':');
      date.setHours(parseInt(hours), parseInt(minutes));
      
      const payload: any = {
        title: val.title,
        visitDate: date.toISOString(),
        status: val.status,
        propertyId: val.propertyId,
        brokerId: val.brokerId,
        notes: val.notes,
        leadId: this.selectedClient.leadId,
        clientName: this.selectedClient.client.name,
        clientEmail: this.selectedClient.client.email,
        clientPhone: this.selectedClient.client.phone
      };
      
      this.dialogRef.close(payload);
    }
  }

  onClientSelected(selection: ClientSelection): void {
    this.selectedClient = selection;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getPropertyTitle(): string {
    if (this.data?.propertyId && this.properties.length) {
      const prop = this.properties.find(p => p.id === this.data.propertyId);
      return prop?.title || 'Selected Property';
    }
    return '';
  }
}
