import { Component, OnInit, inject, AfterViewChecked } from '@angular/core';
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
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/molecules/confirm-dialog/confirm-dialog';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api';
import { DocumentUploadFormComponent } from '../../shared/organisms/document-upload-form/document-upload-form';
import { PaginationComponent } from '../../shared/atoms/pagination/pagination';
import { PropertySearchComponent, SearchFilters, SearchFilterConfig } from '../../shared/molecules/property-search/property-search';
import { ErrorStateComponent } from '../../shared/atoms/error-state/error-state';
import { PageHeaderComponent } from '../../shared/molecules/page-header/page-header';
import { LoadingStateComponent } from '../../shared/atoms/loading-state/loading-state';
import { EmptyStateComponent } from '../../shared/atoms/empty-state/empty-state';

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
    MatDialogModule,
    PaginationComponent,
    PropertySearchComponent,
    ErrorStateComponent,
    PageHeaderComponent,
    LoadingStateComponent,
    EmptyStateComponent
  ],
  templateUrl: './documents.html',
  styleUrl: './documents.css'
})
export class DocumentsPageComponent implements OnInit, AfterViewChecked {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);

  documents: any[] = [];
  highlightedDocId: string | null = null;
  private hasScrolled = false;
  loading = true;
  loadError = false;
  searchQuery = '';
  filterType = 'All';

  documentTypes = [
    'All',
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
    'Custom'
  ];

  searchFilters: SearchFilters = {
    searchQuery: '',
    selectedStatus: 'All',
    selectedType: 'All',
    selectedListingType: 'All',
    selectedCity: 'All',
    minBedrooms: null,
    maxBedrooms: null,
    minBathrooms: null,
    minPrice: null,
    maxPrice: null,
    minArea: null,
    maxArea: null
  };

  searchConfig: SearchFilterConfig = {
    showSearch: true,
    showStatus: false,
    showType: true,
    showCity: false,
    showBedrooms: false,
    showBathrooms: false,
    showPrice: false,
    showArea: false
  };

  typeOptions = [
    'All',
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
    'Custom'
  ];

  pagination = {
    page: 1,
    limit: 12,
    totalItems: 0,
    totalPages: 0
  };

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.highlightedDocId = params['id'];
      }
    });
    this.fetchDocuments();
  }

  ngAfterViewChecked() {
    if (this.highlightedDocId && !this.hasScrolled && this.documents.length > 0) {
      const docIndex = this.documents.findIndex(d => d.id === this.highlightedDocId);
      if (docIndex !== -1) {
        const element = document.querySelector(`[data-doc-id="${this.highlightedDocId}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          this.hasScrolled = true;
        }
      }
    }
  }

  fetchDocuments() {
    this.loading = true;
    this.loadError = false;
    
    const params: any = {
      page: this.pagination.page,
      limit: this.pagination.limit,
    };

    if (this.searchFilters.searchQuery) {
      params.search = this.searchFilters.searchQuery;
    }
    if (this.searchFilters.selectedType && this.searchFilters.selectedType !== 'All') {
      params.type = this.searchFilters.selectedType;
    }

    this.api.getDocuments(params).subscribe({
      next: (res: any) => {
        if (res?.data) {
          this.documents = res.data;
          if (res.pagination) {
            this.pagination = { ...this.pagination, ...res.pagination };
          }
        } else if (Array.isArray(res)) {
          this.documents = res;
          this.pagination.totalItems = res.length;
          this.pagination.totalPages = 1;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to fetch documents', err);
        this.loading = false;
        this.loadError = true;
        this.documents = [];
      }
    });
  }

  onPageChange(page: number) {
    this.pagination.page = Math.min(Math.max(page, 1), this.totalPages);
  }

  get filteredDocuments() {
    let result = this.documents;

    if (this.searchFilters.selectedType !== 'All') {
      result = result.filter(d => d.type === this.searchFilters.selectedType);
    }

    if (this.searchFilters.searchQuery) {
      const q = this.searchFilters.searchQuery.toLowerCase();
      result = result.filter(d =>
        d.title?.toLowerCase().includes(q) ||
        d.type?.toLowerCase().includes(q)
      );
    }

    return result;
  }

  /** QA 2026-09-18: the API returns the full list (no server paging), so the
   * grid pages client-side — previously the grid showed ALL rows while the
   * pager counted something else. */
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredDocuments.length / this.pagination.limit));
  }

  get pagedDocuments(): any[] {
    const page = Math.min(Math.max(this.pagination.page, 1), this.totalPages);
    const start = (page - 1) * this.pagination.limit;
    return this.filteredDocuments.slice(start, start + this.pagination.limit);
  }

  onFiltersChange(filters: SearchFilters) {
    this.searchFilters = filters;
    this.pagination.page = 1;
    this.fetchDocuments();
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
      const url = /^https?:\/\//i.test(version.fileUrl)
        ? version.fileUrl
        : `${environment.apiUrl.replace(/\/api$/, '')}/uploads/${version.fileUrl}`;
      window.open(url, '_blank');
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
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      maxWidth: '95vw',
      data: {
        title: 'Delete document?',
        message: `"${doc.title || 'This document'}" will be permanently deleted. This cannot be undone.`,
        confirmLabel: 'Delete',
        destructive: true
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.api.deleteDocument(doc.id).subscribe({
        next: () => {
          this.snackBar.open('Document deleted', 'Close', { duration: 3000 });
          this.fetchDocuments();
        },
        error: (err) => this.snackBar.open('Delete failed', 'Close', { duration: 3000 })
      });
    });
  }

  onSearchChange() {
    this.pagination.page = 1;
    this.fetchDocuments();
  }

  onFilterChange() {
    this.pagination.page = 1;
    this.fetchDocuments();
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

}
