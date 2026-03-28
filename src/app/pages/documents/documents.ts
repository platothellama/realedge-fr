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
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api';
import { DocumentUploadFormComponent } from '../../components/document-upload-form/document-upload-form';
import { PaginationComponent } from '../../components/pagination/pagination';
import { PropertySearchComponent, SearchFilters, SearchFilterConfig } from '../../components/property-search/property-search';

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
    PropertySearchComponent
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
        this.documents = [];
      }
    });
  }

  onPageChange(page: number) {
    this.pagination.page = page;
    this.fetchDocuments();
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

  private getMockDocuments() {
    return [
      {
        id: '1',
        title: 'Sale Agreement - Villa A101',
        documentType: 'Sales Agreement',
        propertyId: '1',
        property: { title: 'Penthouse with Panoramic City View' },
        versions: [{ fileUrl: 'sample.pdf', version: 1, uploadedAt: new Date() }],
        isSigned: false,
        createdAt: new Date()
      },
      {
        id: '2',
        title: 'Property Title Deed',
        documentType: 'Title Deed',
        propertyId: '2',
        property: { title: 'Ultra Luxury Beachfront Villa' },
        versions: [{ fileUrl: 'deed.pdf', version: 2, uploadedAt: new Date() }],
        isSigned: true,
        createdAt: new Date()
      }
    ];
  }
}
