import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../services/api';
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
    MatIconModule
  ],
  templateUrl: './lead-form.html',
  styleUrl: './lead-form.css'
})
export class LeadFormComponent implements OnInit {
  leadForm: FormGroup;
  isEdit = false;
  users: any[] = [];

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private dialogRef: MatDialogRef<LeadFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
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
      assignedToUserId: [null]
    });
  }

  ngOnInit(): void {
    this.fetchUsers();
    if (this.data && this.data.lead) {
      this.isEdit = true;
      this.leadForm.patchValue(this.data.lead);
    }
  }

  fetchUsers() {
    this.api.getUsers().subscribe({
      next: (res) => this.users = res.data || (Array.isArray(res) ? res : []),
      error: (err) => console.error('Error fetching users', err)
    });
  }

  onSubmit(): void {
    if (this.leadForm.valid) {
      this.dialogRef.close(this.leadForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
