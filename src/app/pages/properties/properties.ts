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
import { PropertyFormComponent } from '../../components/property-form/property-form';
import { PaginationComponent } from '../../components/pagination/pagination';
import { PropertySearchComponent, SearchFilters } from '../../components/property-search/property-search';

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
    PropertySearchComponent
  ],
  templateUrl: './properties.html',
  styleUrl: './properties.css',
})
export class PropertiesComponent implements OnInit {
  properties: any[] = [];
  loading = false;
  deletingId: string | null = null;
  seeding = false;

  filters: SearchFilters = {
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

  pagination = {
    page: 1,
    limit: 12,
    totalItems: 0,
    totalPages: 0
  };

  constructor(
    private apiService: ApiService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit() {
    this.fetchProperties();
  }

  fetchProperties() {
    this.loading = true;
    
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

    this.apiService.getProperties(params).subscribe({
      next: (response: any) => {
        if (response?.data) {
          this.properties = response.data;
          if (response.pagination) {
            this.pagination = { ...this.pagination, ...response.pagination };
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
    if (confirm('Are you sure you want to delete this property?')) {
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
    }
  }

  isDeleting(id: string): boolean {
    return this.deletingId === id;
  }

  seedProperties() {
    if (confirm('This will delete all existing properties and seed 100 new Lebanese properties. Continue?')) {
      this.seeding = true;
      this.apiService.seedProperties().subscribe({
        next: () => {
          this.seeding = false;
          this.fetchProperties();
        },
        error: (err) => {
          console.error('Error seeding properties', err);
          this.seeding = false;
        }
      });
    }
  }
}
