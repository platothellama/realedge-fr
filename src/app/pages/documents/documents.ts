import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApiService } from '../../services/api';
import { DocumentUploadFormComponent } from '../../components/document-upload-form/document-upload-form';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatMenuModule,
    MatTooltipModule,
    FormsModule,
    MatDialogModule
  ],
  templateUrl: './documents.html',
  styleUrl: './documents.css'
})
export class DocumentsPageComponent implements OnInit {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  documents: any[] = [];
  loading = true;
  searchQuery = '';
  filterType = 'All';

  documentTypes = ['All', 'Contract', 'Property Paper', 'Client ID', 'Permit', 'Other'];

  ngOnInit() {
    this.fetchDocuments();
  }

  fetchDocuments() {
    this.loading = true;
    this.api.getDocuments({}).subscribe({
      next: (res) => {
        this.documents = Array.isArray(res) ? res : (res.data || []);
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to fetch documents', err);
        this.loading = false;
        this.documents = [];
      }
    });
  }

  get filteredDocuments() {
    let result = this.documents;

    if (this.filterType !== 'All') {
      result = result.filter(d => d.type === this.filterType);
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(d => 
        d.title?.toLowerCase().includes(q) || 
        d.type?.toLowerCase().includes(q)
      );
    }

    return result;
  }

  openUploadForm() {
    const dialogRef = this.dialog.open(DocumentUploadFormComponent, {
      width: '600px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(formData => {
      if (formData) {
        this.api.uploadDocument(formData).subscribe({
          next: () => {
            this.snackBar.open('Document uploaded successfully', 'Close', { duration: 3000 });
            this.fetchDocuments();
          },
          error: (err) => this.snackBar.open('Upload failed', 'Close', { duration: 3000 })
        });
      }
    });
  }

  downloadDocument(doc: any) {
    const version = doc.versions?.[0];
    if (version?.fileUrl) {
      window.open(`https://realedge-frontend-production.up.railway.app/uploads/${version.fileUrl}`, '_blank');
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

  private getMockDocuments() {
    return [
      {
        id: '1',
        title: 'Sale Agreement - Villa A101',
        documentType: 'Contract',
        propertyId: '1',
        property: { title: 'Penthouse with Panoramic City View' },
        versions: [{ fileUrl: 'sample.pdf', version: 1, uploadedAt: new Date() }],
        isSigned: false,
        createdAt: new Date()
      },
      {
        id: '2',
        title: 'Property Title Deed',
        documentType: 'Property Paper',
        propertyId: '2',
        property: { title: 'Ultra Luxury Beachfront Villa' },
        versions: [{ fileUrl: 'deed.pdf', version: 2, uploadedAt: new Date() }],
        isSigned: true,
        createdAt: new Date()
      }
    ];
  }
}
