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
import { PropertySearchComponent, SearchFilters, SearchFilterConfig, EMPTY_SEARCH_FILTERS } from '../../shared/molecules/property-search/property-search';
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
    ...EMPTY_SEARCH_FILTERS,
    selectedStatus: 'Available',
  };

  /** Every filter the search bar supports on this page. */
  searchConfig: SearchFilterConfig = {
    showSearch: true,
    showStatus: true,
    showType: true,
    showListingType: true,
    showCondition: true,
    showCity: true,
    showCountry: true,
    showBedrooms: true,
    showBathrooms: true,
    showBalconies: true,
    showParking: true,
    showFloor: true,
    showYearBuilt: true,
    showLotSize: true,
    showMasterBedrooms: true,
    showTerraceCellar: true,
    showFeatures: true,
    showPrice: true,
    showArea: true,
    showProject: true,
    showSellerSelect: true,
    showAgent: true,
    showSort: true,
  };

  statusOptions = ['All', 'Available', 'Sold', 'Rented', 'Reserved', 'Lost'];

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
    this.filters.projectId = projectId;
    this.applyFilters();
  }

  toggleGroupByProject() {
    this.groupByProject = !this.groupByProject;
  }

  openProjectUnits(project: any) {
    this.selectedProjectId = project?.id || project?.key || 'All';
    this.filters.projectId = this.selectedProjectId;
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

    const f = this.filters;
    if (f.searchQuery) {
      params.search = f.searchQuery;
    }
    if (f.selectedStatus && f.selectedStatus !== 'All') {
      params.status = f.selectedStatus;
    }
    if (f.minBedrooms != null) {
      params.minBedrooms = f.minBedrooms;
    }
    if (f.maxBedrooms != null) {
      params.maxBedrooms = f.maxBedrooms;
    }
    if (f.minBathrooms != null) {
      params.minBathrooms = f.minBathrooms;
    }
    if (f.maxBathrooms != null) {
      params.maxBathrooms = f.maxBathrooms;
    }
    if (f.minBalconies != null) {
      params.minBalconies = f.minBalconies;
    }
    if (f.maxBalconies != null) {
      params.maxBalconies = f.maxBalconies;
    }
    if (f.minParking != null) {
      params.minParking = f.minParking;
    }
    if (f.maxParking != null) {
      params.maxParking = f.maxParking;
    }
    if (f.minFloor != null) {
      params.minFloor = f.minFloor;
    }
    if (f.maxFloor != null) {
      params.maxFloor = f.maxFloor;
    }
    if (f.minYearBuilt != null) {
      params.minYearBuilt = f.minYearBuilt;
    }
    if (f.maxYearBuilt != null) {
      params.maxYearBuilt = f.maxYearBuilt;
    }
    if (f.minLotSize != null) {
      params.minLotSize = f.minLotSize;
    }
    if (f.maxLotSize != null) {
      params.maxLotSize = f.maxLotSize;
    }
    if (f.minMasterBedrooms != null) {
      params.minMasterBedrooms = f.minMasterBedrooms;
    }
    if (f.minPrice != null) {
      params.minPrice = f.minPrice;
    }
    if (f.maxPrice != null) {
      params.maxPrice = f.maxPrice;
    }
    if (f.minArea != null) {
      params.minArea = f.minArea;
    }
    if (f.maxArea != null) {
      params.maxArea = f.maxArea;
    }
    if (f.selectedType && f.selectedType !== 'All') {
      params.type = f.selectedType;
    }
    if (f.selectedListingType && f.selectedListingType !== 'All') {
      params.listingType = f.selectedListingType;
    }
    if (f.selectedCondition && f.selectedCondition !== 'All') {
      params.condition = f.selectedCondition;
    }
    if (f.selectedCity && f.selectedCity !== 'All') {
      params.city = f.selectedCity;
    }
    if (f.selectedCountry && f.selectedCountry !== 'All') {
      params.country = f.selectedCountry;
    }
    if (f.hasTerrace != null) {
      params.hasTerrace = f.hasTerrace;
    }
    if (f.hasCellar != null) {
      params.hasCellar = f.hasCellar;
    }
    if (f.feature) {
      params.feature = f.feature;
    }
    if (f.assignedToUserId && f.assignedToUserId !== 'All') {
      params.assignedToUserId = f.assignedToUserId;
    }
    if (f.sellerId && f.sellerId !== 'All') {
      params.sellerId = f.sellerId;
    }
    if (f.sortBy) {
      params.sortBy = f.sortBy;
    }
    if (f.sortDir) {
      params.sortDir = f.sortDir;
    }
    // The search bar's own project pill and the page toolbar share one param.
    const projectId = (f.projectId && f.projectId !== 'All') ? f.projectId : this.selectedProjectId;
    if (projectId && projectId !== 'All') {
      params.projectId = projectId;
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
    // Keep the toolbar dropdown in sync with the search bar's project pill.
    if (filters.projectId !== undefined) {
      this.selectedProjectId = filters.projectId;
    }
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
