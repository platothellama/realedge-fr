import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../services/api';
import { DocumentUploadFormComponent } from '../document-upload-form/document-upload-form';

@Component({
  selector: 'app-document-manager',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatMenuModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './document-manager.html',
  styleUrl: './document-manager.css'
})
export class DocumentManagerComponent implements OnInit {
  @Input() propertyId?: string;
  @Input() dealId?: string;

  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  documents: any[] = [];
  loading = true;

  ngOnInit(): void {
    this.fetchDocuments();
  }

  fetchDocuments() {
    const params: any = {};
    if (this.propertyId) params.propertyId = this.propertyId;
    if (this.dealId) params.dealId = this.dealId;

    this.api.getDocuments(params).subscribe({
      next: (res) => {
        this.documents = res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to fetch documents', err);
        this.loading = false;
      }
    });
  }

  openUploadForm(isNewVersion = false, docId?: string) {
    const dialogRef = this.dialog.open(DocumentUploadFormComponent, {
      width: '600px',
      data: { 
        propertyId: this.propertyId, 
        dealId: this.dealId,
        isNewVersion,
        docId
      }
    });

    dialogRef.afterClosed().subscribe(formData => {
      if (formData) {
        if (isNewVersion && docId) {
          this.api.addDocumentVersion(docId, formData).subscribe({
            next: () => {
              this.snackBar.open('New version uploaded', 'Close', { duration: 3000 });
              this.fetchDocuments();
            },
            error: (err) => this.snackBar.open('Upload failed', 'Close', { duration: 3000 })
          });
        } else {
          this.api.uploadDocument(formData).subscribe({
            next: () => {
              this.snackBar.open('Document uploaded successfully', 'Close', { duration: 3000 });
              this.fetchDocuments();
            },
            error: (err) => this.snackBar.open('Upload failed', 'Close', { duration: 3000 })
          });
        }
      }
    });
  }

  downloadDocument(doc: any) {
    const version = doc.versions[0]; // Latest version
    if (version) {
      window.open(`https://realedge-frontend-production.up.railway.app/tend-production.up.railway.app//uploads/${version.fileUrl}`, '_blank');
    }
  }

  signDocument(doc: any) {
    this.api.signDocument(doc.id).subscribe({
      next: () => {
        this.snackBar.open('Document signed successfully', 'Close', { duration: 3000 });
        this.fetchDocuments();
      },
      error: (err) => this.snackBar.open('Signature failed', 'Close', { duration: 3000 })
    });
  }

  deleteDocument(doc: any) {
    if (confirm('Are you sure you want to delete this document?')) {
      this.api.deleteDocument(doc.id).subscribe({
        next: () => {
          this.snackBar.open('Document deleted', 'Close', { duration: 3000 });
          this.fetchDocuments();
        },
        error: (err) => this.snackBar.open('Delete failed', 'Close', { duration: 3000 })
      });
    }
  }

  getIconForType(type: string): string {
    switch (type) {
      case 'Contract': return 'description';
      case 'Property Paper': return 'home_work';
      case 'Client ID': return 'badge';
      case 'Permit': return 'verified';
      default: return 'insert_drive_file';
    }
  }
}
