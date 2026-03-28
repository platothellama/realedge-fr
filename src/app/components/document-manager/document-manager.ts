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
import { ApiService } from '../../services/api';
import { DocumentUploadFormComponent } from '../document-upload-form/document-upload-form';
import { PaginationComponent } from '../pagination/pagination';
import { PropertySearchComponent, SearchFilters, SearchFilterConfig } from '../property-search/property-search';

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
    MatFormFieldModule,
    PaginationComponent,
    PropertySearchComponent
  ],
  templateUrl: './document-manager.html',
  styleUrl: './document-manager.css'
})
export class DocumentManagerComponent implements OnInit {
  @Input() propertyId?: string;
  @Input() dealId?: string;
  @Input() userId?: string;
  @Input() groupId?: string;
  @Input() documentId?: string;

  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  documents: any[] = [];
  filteredDocuments: any[] = [];
  paginatedDocuments: any[] = [];
  loading = true;

  filters: any = {
    searchQuery: '',
    groupFilter: '',
    userFilter: '',
    sellerFilter: '',
    propertyFilter: ''
  };

  searchConfig: SearchFilterConfig = {
    showSearch: true,
    showStatus: false,
    showType: false,
    showCity: false,
    showBedrooms: false,
    showBathrooms: false,
    showPrice: false,
    showArea: false,
    showGroup: true,
    showUser: true,
    showSeller: true,
    showProperty: true
  };
  
  expandedDocs: Set<string> = new Set();
  showPreview = false;
  previewDoc: any = null;
  private searchDebounce: any;

  pageSize = 12;
  pageIndex = 0;
  totalDocuments = 0;

  pagination = {
    page: 1,
    limit: 12,
    totalItems: 0,
    totalPages: 0
  };

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
        
        if (this.documentId) {
          const doc = this.documents.find(d => d.id === this.documentId);
          if (doc) {
            this.expandedDocs.add(this.documentId);
            setTimeout(() => {
              const element = document.querySelector(`[data-doc-id="${this.documentId}"]`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 100);
          }
        }
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
      case 'Title Deed': return 'article';
      case 'Floor Plan': return 'grid_view';
      case 'Property Photos': return 'photo_library';
      case 'Ownership Proof': return 'owner';
      case 'Reservation Form': return 'event_available';
      case 'Sales Agreement': return 'handshake';
      case 'Contract': return 'description';
      case 'Payment Receipt': return 'receipt';
      case 'ID / Passport': return 'badge';
      case 'Proof of Funds': return 'account_balance';
      case 'Custom': return 'folder';
      default: return 'insert_drive_file';
    }
  }

  getPreviewUrl(fileUrl: string): string {
    const baseUrl = 'https://realedge-frontend-production.up.railway.app/uploads/';
    return baseUrl + fileUrl;
  }

  isImageFile(fileUrl: string): boolean {
    if (!fileUrl) return false;
    const ext = fileUrl.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext || '');
  }

  isPdfFile(fileUrl: string): boolean {
    if (!fileUrl) return false;
    const ext = fileUrl.split('.').pop()?.toLowerCase();
    return ext === 'pdf';
  }

  filterDocuments() {
    let results = [...this.documents];
    
    if (this.filters.searchQuery?.trim()) {
      const query = this.filters.searchQuery.toLowerCase();
      results = results.filter(doc =>
        doc.title?.toLowerCase().includes(query) ||
        doc.type?.toLowerCase().includes(query) ||
        doc.status?.toLowerCase().includes(query)
      );
    }
    
    if (this.filters.groupFilter?.trim()) {
      const query = this.filters.groupFilter.toLowerCase();
      results = results.filter(doc =>
        doc.group?.name?.toLowerCase().includes(query)
      );
    }
    
    if (this.filters.userFilter?.trim()) {
      const query = this.filters.userFilter.toLowerCase();
      results = results.filter(doc =>
        doc.user?.name?.toLowerCase().includes(query)
      );
    }
    
    if (this.filters.sellerFilter?.trim()) {
      const query = this.filters.sellerFilter.toLowerCase();
      results = results.filter(doc =>
        doc.seller?.name?.toLowerCase().includes(query) ||
        doc.seller?.email?.toLowerCase().includes(query)
      );
    }
    
    if (this.filters.propertyFilter?.trim()) {
      const query = this.filters.propertyFilter.toLowerCase();
      results = results.filter(doc =>
        doc.property?.title?.toLowerCase().includes(query) ||
        doc.property?.address?.toLowerCase().includes(query) ||
        doc.property?.id?.toLowerCase().includes(query)
      );
    }
    
    this.filteredDocuments = results;
    this.totalDocuments = this.filteredDocuments.length;
    this.pagination.totalItems = this.filteredDocuments.length;
    this.pagination.totalPages = Math.ceil(this.filteredDocuments.length / this.pagination.limit);
    this.pagination.page = 1;
    this.pageIndex = 0;
    this.updatePaginatedDocuments();
  }

  onSearchChange() {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.filterDocuments();
    }, 300);
  }

  onFiltersChange(filters: any) {
    this.filters = filters;
    this.filterDocuments();
  }

  clearFilters() {
    this.filters = {
      searchQuery: '',
      groupFilter: '',
      userFilter: '',
      sellerFilter: '',
      propertyFilter: ''
    };
    this.filterDocuments();
  }

  toggleExpand(docId: string) {
    if (this.expandedDocs.has(docId)) {
      this.expandedDocs.delete(docId);
    } else {
      this.expandedDocs.add(docId);
    }
  }

  isExpanded(docId: string): boolean {
    return this.expandedDocs.has(docId);
  }

  openPreview(doc: any) {
    this.previewDoc = doc;
    this.showPreview = true;
  }

  closePreview() {
    this.showPreview = false;
    this.previewDoc = null;
  }

  updatePaginatedDocuments() {
    const start = (this.pagination.page - 1) * this.pagination.limit;
    const end = start + this.pagination.limit;
    this.paginatedDocuments = this.filteredDocuments.slice(start, end);
  }

  onPaginationChange(page: number) {
    this.pagination.page = page;
    this.updatePaginatedDocuments();
  }
}
