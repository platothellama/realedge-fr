import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth/auth.service';
import { PropertyFormComponent } from '../../shared/organisms/property-form/property-form';
import { PropertyImportDialogComponent } from '../../shared/organisms/property-import-dialog/property-import-dialog';
import { PaginationComponent } from '../../shared/atoms/pagination/pagination';
import { PropertySearchComponent, SearchFilters } from '../../shared/molecules/property-search/property-search';
import { ConfirmDialogComponent } from '../../shared/molecules/confirm-dialog/confirm-dialog';
import { ErrorStateComponent } from '../../shared/atoms/error-state/error-state';
import { PageHeaderComponent } from '../../shared/molecules/page-header/page-header';
import { EmptyStateComponent } from '../../shared/atoms/empty-state/empty-state';

@Component({
  selector: 'app-properties',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    FormsModule,
    PaginationComponent,
    PropertySearchComponent,
    ErrorStateComponent,
    PageHeaderComponent,
    EmptyStateComponent
  ],
  templateUrl: './properties.html',
  styleUrl: './properties.css',
})
export class PropertiesComponent implements OnInit {
  properties: any[] = [];
  projects: any[] = [];
  loading = false;
  loadError = false;
  deletingId: string | null = null;
  selectedProjectId: string = 'All';
  groupByProject = false;

  filters: SearchFilters = {
    searchQuery: '',
    selectedStatus: 'Available',
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

  statusOptions = ['Available', 'All', 'Sold', 'Rented', 'Reserved'];

  pagination = {
    page: 1,
    limit: 12,
    totalItems: 0,
    totalPages: 0
  };

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  /** Same roles allowed to create properties via POST /properties. */
  get canImport(): boolean {
    return this.authService.hasRole(['Super Admin', 'Admin', 'Office Manager', 'Broker']);
  }

  ngOnInit() {
    this.fetchProjects();
    this.fetchProperties();
  }

  fetchProjects() {
    this.apiService.getProjects().subscribe({
      next: (res: any) => {
        this.projects = Array.isArray(res) ? res : (res?.data || []);
      },
      error: () => this.projects = []
    });
  }

  /** Apartments sharing a project are grouped together; standalone listings fall under "Standalone". */
  get groupedProperties(): { key: string; name: string; units: any[] }[] {
    const map = new Map<string, { key: string; name: string; units: any[] }>();
    for (const p of this.properties) {
      const pid = p.projectId || p.project?.id || null;
      const key = pid || 'standalone';
      if (!map.has(key)) {
        map.set(key, {
          key,
          name: p.project?.name || (pid ? 'Project' : 'Standalone'),
          units: []
        });
      }
      map.get(key)!.units.push(p);
    }
    return [...map.values()].sort((a, b) => {
      if (a.key === 'standalone') return 1;
      if (b.key === 'standalone') return -1;
      return a.name.localeCompare(b.name);
    });
  }

  onProjectFilterChange(projectId: string) {
    this.selectedProjectId = projectId;
    this.applyFilters();
  }

  toggleGroupByProject() {
    this.groupByProject = !this.groupByProject;
  }

  openProjectUnits(project: any) {
    this.selectedProjectId = project?.id || project?.key || 'All';
    this.groupByProject = false;
    this.applyFilters();
  }

  fetchProperties() {
    this.loading = true;
    this.loadError = false;
    
    const params: any = {
      page: this.pagination.page,
      limit: this.pagination.limit,
    };

    if (this.filters.searchQuery) {
      params.search = this.filters.searchQuery;
    }
    if (this.filters.selectedStatus && this.filters.selectedStatus !== 'All') {
      params.status = this.filters.selectedStatus;
    }
    if (this.filters.minBedrooms) {
      params.minBedrooms = this.filters.minBedrooms;
    }
    if (this.filters.maxBedrooms) {
      params.maxBedrooms = this.filters.maxBedrooms;
    }
    if (this.filters.minBathrooms) {
      params.minBathrooms = this.filters.minBathrooms;
    }
    if (this.filters.minPrice) {
      params.minPrice = this.filters.minPrice;
    }
    if (this.filters.maxPrice) {
      params.maxPrice = this.filters.maxPrice;
    }
    if (this.filters.minArea) {
      params.minArea = this.filters.minArea;
    }
    if (this.filters.maxArea) {
      params.maxArea = this.filters.maxArea;
    }
    if (this.filters.selectedType && this.filters.selectedType !== 'All') {
      params.type = this.filters.selectedType;
    }
    if (this.filters.selectedCity && this.filters.selectedCity !== 'All') {
      params.city = this.filters.selectedCity;
    }
    if (this.selectedProjectId && this.selectedProjectId !== 'All') {
      params.projectId = this.selectedProjectId;
    }

    this.apiService.getProperties(params).subscribe({
      next: (response: any) => {
        if (response?.data) {
          this.properties = response.data;
          if (response.pagination) {
            this.pagination = { ...this.pagination, ...response.pagination };
            // QA 2026-09-18: clamp stale out-of-range pages (e.g. deleting
            // the last item on the last page left "Showing 49-48 of 48").
            const totalPages = this.pagination.totalPages || 1;
            if (this.pagination.page > totalPages && totalPages > 0) {
              this.pagination.page = totalPages;
              this.fetchProperties();
              return;
            }
          }
        } else if (Array.isArray(response)) {
          this.properties = response;
          this.pagination.totalItems = response.length;
          this.pagination.totalPages = 1;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to fetch properties', err);
        this.loading = false;
        this.loadError = true;
      }
    });
  }

  onPageChange(page: number) {
    this.pagination.page = page;
    this.fetchProperties();
  }

  applyFilters() {
    this.pagination.page = 1;
    this.fetchProperties();
  }

  onFiltersChange(filters: SearchFilters) {
    this.filters = filters;
    this.applyFilters();
  }

  openPropertyForm(property?: any) {
    const dialogRef = this.dialog.open(PropertyFormComponent, {
      width: '800px',
      data: { property }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (property && property.id) {
          this.updateProperty(property.id, result);
        } else {
          this.createProperty(result);
        }
      }
    });
  }

  openPropertyDetails(property: any) {
    this.router.navigate(['/properties', property.id]);
  }

  openImportDialog() {
    const dialogRef = this.dialog.open(PropertyImportDialogComponent, {
      width: '1000px',
      maxWidth: '95vw',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.created > 0) this.fetchProperties();
    });
  }

  createProperty(data: any) {
    this.apiService.createProperty(data).subscribe({
      next: () => this.fetchProperties(),
      error: (err) => console.error('Error creating property', err)
    });
  }

  updateProperty(id: string, data: any) {
    this.apiService.updateProperty(id, data).subscribe({
      next: () => this.fetchProperties(),
      error: (err) => console.error('Error updating property', err)
    });
  }

  deleteProperty(id: string) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      maxWidth: '95vw',
      data: {
        title: 'Delete property?',
        message: 'This property will be permanently deleted. This cannot be undone.',
        confirmLabel: 'Delete',
        destructive: true
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.deletingId = id;
      this.apiService.deleteProperty(id).subscribe({
        next: () => {
          this.fetchProperties();
          this.deletingId = null;
        },
        error: (err) => {
          console.error('Error deleting property', err);
          this.deletingId = null;
        }
      });
    });
  }

  isDeleting(id: string): boolean {
    return this.deletingId === id;
  }

}
