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
  selectedFiles: File[] = [];
  
  propertyTypes = ['Title Deed', 'Floor Plan', 'Property Photos', 'Ownership Proof', 'Other'];
  dealTypes = ['Reservation Form', 'Sales Agreement', 'Contract', 'Payment Receipt', 'ID / Passport', 'Proof of Funds', 'Other'];
  allTypes = [
    'Title Deed',
    'Floor Plan',
    'Property Photos',
    'Ownership Proof',
    'Reservation Form',
    'Sales Agreement',
    'Contract',
    'Payment Receipt',
    'ID / Passport',
    'Proof of Funds',
    'Other'
  ];
  
  get filteredTypes(): string[] {
    if (this.data?.dealId && !this.data?.propertyId) {
      return this.dealTypes;
    }
    if (this.data?.propertyId && !this.data?.dealId) {
      return this.propertyTypes;
    }
    return this.allTypes;
  }
  
  signerTypes = ['Client', 'Agent', 'Owner'];
  selectedSigners: string[] = [];
  signerEmails: { [key: string]: string } = {};
  isSubmitting = false;
  sellers: any[] = [];
  teams: any[] = [];
  properties: any[] = [];
  
  private api = inject(ApiService);

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DocumentUploadFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    const defaultType = this.getDefaultType();
    this.uploadForm = this.fb.group({
      title: ['', Validators.required],
      type: [defaultType, Validators.required],
      propertyId: [this.data?.propertyId || ''],
      sellerId: [''],
      teamUserId: [''],
      visibility: ['internal'],
      isDigitalSignatureEnabled: [false],
      notes: ['']
    });
  }

  private getDefaultType(): string {
    if (this.data?.suggestedType) {
      return this.data.suggestedType;
    }
    if (this.data?.dealId && !this.data?.propertyId) {
      return 'Contract';
    }
    if (this.data?.propertyId && !this.data?.dealId) {
      return 'Title Deed';
    }
    return 'Contract';
  }

  ngOnInit(): void {
    this.loadSellers();
    this.loadTeams();
    this.loadProperties();
  }

  toggleSigner(signer: string) {
    const index = this.selectedSigners.indexOf(signer);
    if (index > -1) {
      this.selectedSigners.splice(index, 1);
      delete this.signerEmails[signer];
    } else {
      this.selectedSigners.push(signer);
      this.signerEmails[signer] = '';
    }
  }

  isSignerSelected(signer: string): boolean {
    return this.selectedSigners.includes(signer);
  }

  getSignerEmail(signer: string): string {
    return this.signerEmails[signer] || '';
  }

  setSignerEmail(signer: string, email: string) {
    this.signerEmails[signer] = email;
  }

  loadSellers() {
    this.api.getSellers().subscribe({
      next: (res) => this.sellers = res || [],
      error: () => this.sellers = []
    });
  }

  loadTeams() {
    this.api.getTeams().subscribe({
      next: (res) => this.teams = res || [],
      error: () => this.teams = []
    });
  }

  loadProperties() {
    this.api.getProperties({}).subscribe({
      next: (res: any) => this.properties = res?.data || res || [],
      error: () => this.properties = []
    });
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedFiles = Array.from(files);
    }
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  getTotalSize(): string {
    const total = this.selectedFiles.reduce((sum, file) => sum + file.size, 0);
    if (total > 1024 * 1024) {
      return (total / (1024 * 1024)).toFixed(1) + ' MB';
    }
    return (total / 1024).toFixed(1) + ' KB';
  }

  onSubmit() {
    if (this.uploadForm.valid && (this.selectedFiles.length > 0 || this.data.isNewVersion) && !this.isSubmitting) {
      this.isSubmitting = true;
      const formData = new FormData();
      
      this.selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      
      const formValue = this.uploadForm.value;
      Object.keys(formValue).forEach(key => {
        if (formValue[key]) {
          formData.append(key, formValue[key]);
        }
      });

      if (this.selectedSigners.length > 0) {
        const signers = this.selectedSigners.map(type => ({
          type,
          email: this.signerEmails[type] || null,
          name: null,
          status: 'pending'
        }));
        formData.append('signers', JSON.stringify(signers));
      }

      if (this.data.propertyId) formData.append('propertyId', this.data.propertyId);
      if (this.data.dealId) formData.append('dealId', this.data.dealId);

      this.dialogRef.close(formData);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
