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
  selector: 'app-document-suggestion',
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
  templateUrl: './document-suggestion.html',
  styleUrl: './document-suggestion.css'
})
export class DocumentSuggestionComponent implements OnInit {
  uploadForm: FormGroup;
  selectedFile: File | null = null;
  suggestedTypes = ['Reservation Form', 'Contract', 'Payment Receipt'];
  isSubmitting = false;
  
  private api = inject(ApiService);

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DocumentSuggestionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.uploadForm = this.fb.group({
      title: ['', Validators.required],
      type: [this.data?.suggestedType || 'Contract', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    if (this.data?.suggestedType) {
      this.uploadForm.patchValue({
        type: this.data.suggestedType,
        title: this.getDefaultTitle(this.data.suggestedType)
      });
    }
  }

  getDefaultTitle(type: string): string {
    const propertyTitle = this.data?.propertyTitle || 'Property';
    switch (type) {
      case 'Reservation Form': return `Reservation - ${propertyTitle}`;
      case 'Contract': return `Sales Contract - ${propertyTitle}`;
      case 'Payment Receipt': return `Payment Receipt - ${propertyTitle}`;
      default: return `Document - ${propertyTitle}`;
    }
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

  removeFile() {
    this.selectedFile = null;
  }

  onSubmit() {
    if (this.uploadForm.valid && this.selectedFile && !this.isSubmitting) {
      this.isSubmitting = true;
      const formData = new FormData();
      
      formData.append('files', this.selectedFile);
      
      const formValue = this.uploadForm.value;
      Object.keys(formValue).forEach(key => {
        if (formValue[key]) {
          formData.append(key, formValue[key]);
        }
      });

      if (this.data?.propertyId) formData.append('propertyId', this.data.propertyId);
      if (this.data?.dealId) formData.append('dealId', this.data.dealId);

      this.dialogRef.close(formData);
    }
  }

  skip() {
    this.dialogRef.close(null);
  }
}
