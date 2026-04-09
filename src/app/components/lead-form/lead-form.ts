import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth/auth.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-lead-form',
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
    MatProgressSpinnerModule
  ],
  templateUrl: './lead-form.html',
  styleUrl: './lead-form.css'
})
export class LeadFormComponent implements OnInit {
  leadForm: FormGroup;
  isEdit = false;
  currentUser: any = null;
  isAdmin = false;
  showAssignmentDropdown = false;
  users: any[] = [];
  leads: any[] = [];
  isSubmitting = false;
  referenceTypes = [
    { value: 'text', label: 'Text' },
    { value: 'lead', label: 'Lead Reference' },
    { value: 'user', label: 'User Reference' }
  ];

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private auth: AuthService,
    private dialogRef: MatDialogRef<LeadFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    const user = this.auth.currentUser();
    this.currentUser = user;
    const userRole = user?.role || '';
    this.isAdmin = userRole === 'Super Admin';
    this.showAssignmentDropdown = this.isAdmin;
    
    const defaultAssignedToUserId = user?.id || null;

    this.leadForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      source: ['Website', Validators.required],
      status: ['New Lead', Validators.required],
      budget: [null, [Validators.required, Validators.min(0)]],
      nationality: [''],
      preferredAreas: [''],
      propertyPreferences: [''],
      notes: [''],
      assignedToUserId: [defaultAssignedToUserId],
      job: [''],
      referenceType: ['text'],
      referenceId: [null],
      referenceText: ['']
    });
  }

  ngOnInit(): void {
    this.fetchUsers();
    this.fetchLeads();
    if (this.data && this.data.lead) {
      this.isEdit = true;
      this.leadForm.patchValue(this.data.lead);
    }
  }

  fetchUsers() {
    this.api.getUsers().subscribe({
      next: (res: any) => {
        this.users = Array.isArray(res) ? res : (res.data || []);
      },
      error: (err) => {
        console.error('Error fetching users', err);
        this.users = [];
      }
    });
  }

  fetchLeads() {
    this.api.getLeads().subscribe({
      next: (res: any) => {
        this.leads = Array.isArray(res) ? res : (res.data || []);
      },
      error: (err) => {
        console.error('Error fetching leads', err);
        this.leads = [];
      }
    });
  }

  onReferenceTypeChange(event: any) {
    const refType = event.value;
    if (refType === 'lead') {
      this.fetchLeads();
    }
  }

  onSubmit(): void {
    if (this.leadForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.dialogRef.close(this.leadForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
