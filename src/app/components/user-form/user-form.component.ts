import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-user-form',
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
  templateUrl: './user-form.html',
  styleUrl: './user-form.css'
})
export class UserFormComponent implements OnInit {
  userForm: FormGroup;
  isEdit = false;
  roles = [
    { name: 'Super Admin', icon: 'auto_awesome', desc: 'Full system access and configurations' },
    { name: 'Admin', icon: 'security', desc: 'Manage team, properties and deals' },
    { name: 'Broker', icon: 'business_center', desc: 'Manage assigned deals and listings' },
    { name: 'Agent', icon: 'person', desc: 'Handle leads and property tasks' },
    { name: 'Office Manager', icon: 'admin_panel_settings', desc: 'Administrative oversight' },
    { name: 'Accountant', icon: 'payments', desc: 'Financial records and commissions' },
    { name: 'Marketing', icon: 'campaign', desc: 'Manage listings and campaigns' },
    { name: 'Client', icon: 'badge', desc: 'External access for property owners' }
  ];
  groups: any[] = [];
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private dialogRef: MatDialogRef<UserFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', this.isEdit ? [] : [Validators.required, Validators.minLength(6)]],
      role: ['Agent', Validators.required],
      groupIds: [[]]
    });
  }

  ngOnInit(): void {
    this.apiService.getGroups().subscribe({
      next: (res) => this.groups = res,
      error: (err) => console.error('Error fetching groups', err)
    });

    if (this.data && this.data.user) {
      this.isEdit = true;
      const u = this.data.user;
      this.userForm.patchValue({
        ...u,
        groupIds: u.groups ? u.groups.map((g: any) => g.id) : []
      });
      // Password is not required when editing
      this.userForm.get('password')?.clearValidators();
      this.userForm.get('password')?.updateValueAndValidity();
    }
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.dialogRef.close(this.userForm.value);
    }
  }
}
