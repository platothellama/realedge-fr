import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { PageEvent } from '@angular/material/paginator';
import { ApiService } from '../../services/api';
import { DocumentUploadFormComponent } from '../document-upload-form/document-upload-form';

@Component({
  selector: 'app-document-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatMenuModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatInputModule,
    MatFormFieldModule
  ],
  templateUrl: './document-manager.html',
  styleUrl: './document-manager.css'
})
export class DocumentManagerComponent implements OnInit {
  @Input() propertyId?: string;
  @Input() dealId?: string;
  @Input() userId?: string;
  @Input() groupId?: string;

  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  documents: any[] = [];
  filteredDocuments: any[] = [];
  paginatedDocuments: any[] = [];
  loading = true;
  searchQuery = '';

  pageSize = 9;
  pageIndex = 0;
  totalDocuments = 0;

  pagination = {
    page: 1,
    limit: 9,
    totalItems: 0,
    totalPages: 0
  };

  Math = Math;

  ngOnInit(): void {
    this.fetchDocuments();
  }

  fetchDocuments() {
    const params: any = {};
    if (this.propertyId) params.propertyId = this.propertyId;
    if (this.dealId) params.dealId = this.dealId;
    if (this.userId) params.userId = this.userId;
    if (this.groupId) params.groupId = this.groupId;

    this.api.getDocuments(params).subscribe({
      next: (res: any) => {
        this.documents = Array.isArray(res) ? res : (res?.data || []);
        this.filterDocuments();
        this.loading = false;
        this.updatePaginatedDocuments();
      },
      error: (err) => {
        console.error('Failed to fetch documents', err);
        this.loading = false;
        this.documents = [];
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

  copySigningUrl(doc: any, signerEmail?: string, signerType?: string, signerRole?: string, requireEmailVerification = false) {
    const signingData: any = {
      signerEmail,
      signerType,
      signerRole,
      requireEmailVerification,
      signingOrder: doc.signingOrder || 'sequential'
    };
    
    if (doc.signingToken) {
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/sign/${doc.id}/${doc.signingToken}`;
      navigator.clipboard.writeText(url).then(() => {
        this.snackBar.open('Signing URL copied to clipboard!', 'Close', { duration: 3000 });
      }).catch(() => {
        this.snackBar.open('Signing URL: ' + url, 'Close', { duration: 5000 });
      });
    } else {
      this.api.generateSigningLink(doc.id, signingData).subscribe({
        next: (res) => {
          const url = res.signingLink;
          const token = url.split('/sign/')[1];
          doc.signingToken = token;
          this.fetchDocuments();
          navigator.clipboard.writeText(url).then(() => {
            this.snackBar.open('Signing URL copied to clipboard!', 'Close', { duration: 3000 });
          }).catch(() => {
            this.snackBar.open('Signing URL: ' + url, 'Close', { duration: 5000 });
          });
        },
        error: (err) => this.snackBar.open('Failed to generate signing URL', 'Close', { duration: 3000 })
      });
    }
  }

  viewAuditTrail(doc: any) {
    this.api.getDocumentAuditTrail(doc.id).subscribe({
      next: (res) => {
        const auditInfo = res.auditLogs.map((log: any) => 
          `${new Date(log.createdAt).toLocaleString()} - ${log.action} - ${log.ipAddress || 'N/A'}`
        ).join('\n');
        alert(`Audit Trail for: ${doc.title}\n\n${auditInfo || 'No audit events recorded'}`);
      },
      error: () => {
        this.snackBar.open('Failed to load audit trail', 'Close', { duration: 3000 });
      }
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

  filterDocuments() {
    if (!this.searchQuery.trim()) {
      this.filteredDocuments = [...this.documents];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredDocuments = this.documents.filter(doc => 
        doc.title?.toLowerCase().includes(query) ||
        doc.type?.toLowerCase().includes(query) ||
        doc.status?.toLowerCase().includes(query) ||
        doc.user?.name?.toLowerCase().includes(query) ||
        doc.group?.name?.toLowerCase().includes(query)
      );
    }
    this.totalDocuments = this.filteredDocuments.length;
    this.pagination.totalItems = this.filteredDocuments.length;
    this.pagination.totalPages = Math.ceil(this.filteredDocuments.length / this.pagination.limit);
    this.pagination.page = 1;
    this.pageIndex = 0;
    this.updatePaginatedDocuments();
  }

  onSearchChange() {
    this.filterDocuments();
  }

  updatePaginatedDocuments() {
    const start = (this.pagination.page - 1) * this.pagination.limit;
    const end = start + this.pagination.limit;
    this.paginatedDocuments = this.filteredDocuments.slice(start, end);
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedDocuments();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const total = this.pagination.totalPages;
    const current = this.pagination.page;
    
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push(-1);
        pages.push(total);
      } else if (current >= total - 3) {
        pages.push(1);
        pages.push(-1);
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push(-1);
        pages.push(total);
      }
    }
    return pages;
  }
}
