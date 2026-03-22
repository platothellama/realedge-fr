import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-group-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './group-form.html',
  styleUrl: './group-form.css'
})
export class GroupFormComponent implements OnInit {
  groupForm: FormGroup;
  isEdit: boolean = false;
  users: any[] = [];
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private dialogRef: MatDialogRef<GroupFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isEdit = !!data?.group;

    // Extract user IDs from the group's members if editing
    const selectedUserIds = data?.group?.members?.map((m: any) => m.id) || [];

    this.groupForm = this.fb.group({
      name: [data?.group?.name || '', Validators.required],
      description: [data?.group?.description || ''],
      userIds: [selectedUserIds]
    });
  }

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers() {
    this.api.getUsers().subscribe({
      next: (res) => {
        this.users = Array.isArray(res) ? res : (res.data || []);
      },
      error: (err) => {
        console.error('Failed to fetch users', err);
        this.users = [];
      }
    });
  }

  onSubmit(): void {
    if (this.groupForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.dialogRef.close(this.groupForm.value);
    }
  }
}
