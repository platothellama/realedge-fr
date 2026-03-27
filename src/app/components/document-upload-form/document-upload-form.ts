import { Component, Inject, OnInit, inject } from '@angular/core';
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
  selector: 'app-document-upload-form',
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
  templateUrl: './document-upload-form.html',
  styleUrl: './document-upload-form.css'
})
export class DocumentUploadFormComponent implements OnInit {
  uploadForm: FormGroup;
  selectedFile: File | null = null;
  types = ['Contract', 'Property Paper', 'Client ID', 'Permit', 'Other'];
  isSubmitting = false;
  users: any[] = [];
  groups: any[] = [];
  properties: any[] = [];

  private api = inject(ApiService);

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DocumentUploadFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.uploadForm = this.fb.group({
      title: ['', Validators.required],
      type: ['Contract', Validators.required],
      visibility: ['shareable'],
      isDigitalSignatureEnabled: [false],
      signerClient: [false],
      signerAgent: [false],
      signerOwner: [false],
      signatureStatus: ['pending'],
      notes: [''],
      userId: [''],
      groupId: [''],
      propertyId: [this.data?.propertyId || '']
    });
  }

  ngOnInit(): void {
    this.loadUsersAndGroups();
    this.loadProperties();
  }

  loadProperties() {
    this.api.getProperties().subscribe({
      next: (res: any) => {
        this.properties = Array.isArray(res) ? res : (res?.data || []);
        if (this.data?.propertyId) {
          this.uploadForm.get('propertyId')?.setValue(this.data.propertyId);
        }
      }
    });
  }

  loadUsersAndGroups() {
    this.api.getUsers().subscribe({
      next: (res: any) => this.users = Array.isArray(res) ? res : (res?.data || [])
    });
    this.api.getGroups().subscribe({
      next: (res: any) => this.groups = Array.isArray(res) ? res : (res?.data || [])
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      if (!this.uploadForm.get('title')?.value) {
        this.uploadForm.get('title')?.setValue(file.name.split('.').slice(0, -1).join('.'));
      }
    }
  }

  onSubmit() {
    if (this.uploadForm.valid && (this.selectedFile || this.data.isNewVersion) && !this.isSubmitting) {
      this.isSubmitting = true;
      const formData = new FormData();
      if (this.selectedFile) {
        formData.append('file', this.selectedFile);
      }
      
      const formValue = this.uploadForm.value;
      Object.keys(formValue).forEach(key => {
        if (formValue[key]) {
          formData.append(key, formValue[key]);
        }
      });

      this.dialogRef.close(formData);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
