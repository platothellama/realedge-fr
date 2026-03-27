import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-document-sign',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './document-sign.html',
  styleUrl: './document-sign.css'
})
export class DocumentSignPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  loading = true;
  error = '';
  document: any = null;
  version: any = null;
  property: any = null;
  signerType = '';
  canSign = false;
  signing = false;
  signed = false;
  signatureDetails: any = null;

  signForm: FormGroup = this.fb.group({
    signerName: ['', Validators.required],
    agreedToTerms: [false, Validators.requiredTrue]
  });

  ngOnInit() {
    const documentId = this.route.snapshot.params['documentId'];
    const token = this.route.snapshot.params['token'];
    this.loadSigningData(documentId, token);
  }

  loadSigningData(documentId: string, token: string) {
    this.api.getPublicSigningData(documentId, token).subscribe({
      next: (res: any) => {
        this.document = res.document;
        this.version = res.version;
        this.property = res.property;
        this.signerType = res.signerType;
        this.canSign = res.canSign;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Invalid or expired signing link';
        this.loading = false;
      }
    });
  }

  signDocument() {
    if (this.signForm.valid && !this.signing) {
      this.signing = true;
      const documentId = this.route.snapshot.params['documentId'];
      const token = this.route.snapshot.params['token'];

      this.api.processPublicSignature(documentId, token, this.signForm.value).subscribe({
        next: (res: any) => {
          this.signed = true;
          this.signatureDetails = res.signatureDetails;
          this.signing = false;
        },
        error: (err: any) => {
          this.snackBar.open(err.error?.message || 'Failed to sign document', 'Close', { duration: 5000 });
          this.signing = false;
        }
      });
    }
  }

  goHome() {
    this.router.navigate(['/']);
  }

  downloadDocument() {
    if (this.version?.fileUrl) {
      const baseUrl = this.api['apiUrl'];
      const url = `${baseUrl}/uploads/${this.version.fileUrl}`;
      window.open(url, '_blank');
    }
  }

  getFileSize(bytes: number): string {
    if (bytes > 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
    return (bytes / 1024).toFixed(2) + ' KB';
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleString();
  }
}
