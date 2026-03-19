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
    FormsModule
  ],
  templateUrl: './properties.html',
  styleUrl: './properties.css',
})
export class PropertiesComponent implements OnInit {
  properties: any[] = [];
  loading = false;
  deletingId: string | null = null;
  seeding = false;

  searchQuery: string = '';
  selectedStatus: string = 'All';
  minBedrooms: number | null = null;

  pagination = {
    page: 1,
    limit: 12,
    totalItems: 0,
    totalPages: 0
  };

  Math = Math;

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

    if (this.searchQuery) {
      params.search = this.searchQuery;
    }
    if (this.selectedStatus && this.selectedStatus !== 'All') {
      params.status = this.selectedStatus;
    }
    if (this.minBedrooms) {
      params.minBedrooms = this.minBedrooms;
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

  applyFilters() {
    this.pagination.page = 1;
    this.fetchProperties();
  }

  clearFilters() {
    this.selectedStatus = 'All';
    this.minBedrooms = null;
    this.searchQuery = '';
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
