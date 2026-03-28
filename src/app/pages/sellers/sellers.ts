import { Component, OnInit, ViewChild, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api';
import { FormsModule } from '@angular/forms';
import { PropertySearchComponent, SearchFilters, SearchFilterConfig } from '../../components/property-search/property-search';

@Component({
  selector: 'app-sellers',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatExpansionModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    FormsModule,
    PropertySearchComponent
  ],
  templateUrl: './sellers.html',
  styleUrl: './sellers.css'
})
export class SellersComponent implements OnInit {
  sellers: any[] = [];
  displayedColumns: string[] = ['name', 'email', 'phone', 'city', 'propertiesCount', 'actions'];
  searchQuery = '';

  isLoading = false;

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
    showType: false,
    showCity: false,
    showBedrooms: false,
    showBathrooms: false,
    showPrice: false,
    showArea: false
  };

  constructor(
    private api: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.fetchSellers();
  }

  get filteredSellers(): any[] {
    if (!this.searchFilters.searchQuery) return this.sellers;
    const q = this.searchFilters.searchQuery.toLowerCase();
    return this.sellers.filter(s => 
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.phone?.toLowerCase().includes(q) ||
      s.city?.toLowerCase().includes(q)
    );
  }

  onFiltersChange(filters: SearchFilters) {
    this.searchFilters = filters;
  }

  fetchSellers() {
    this.isLoading = true;
    this.api.getSellers().subscribe({
      next: (res: any) => {
        this.sellers = Array.isArray(res) ? res : (res.data || []);
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error fetching sellers', err);
        this.showError('Failed to load sellers');
        this.isLoading = false;
      }
    });
  }

  getPropertiesCount(seller: any): number {
    return seller.properties?.length || 0;
  }

  openSellerForm(seller?: any) {
    const dialogRef = this.dialog.open(SellerFormDialogComponent, {
      width: '500px',
      data: { seller }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (seller) {
          this.updateSeller(seller.id, result);
        } else {
          this.createSeller(result);
        }
      }
    });
  }

  createSeller(data: any) {
    this.api.createSeller(data).subscribe({
      next: () => {
        this.showSuccess('Seller created successfully');
        this.fetchSellers();
      },
      error: (err: any) => this.showError('Failed to create seller')
    });
  }

  updateSeller(id: string, data: any) {
    this.api.updateSeller(id, data).subscribe({
      next: () => {
        this.showSuccess('Seller updated successfully');
        this.fetchSellers();
      },
      error: (err: any) => this.showError('Failed to update seller')
    });
  }

  showError(msg: string) {
    this.snackBar.open(msg, 'Close', { duration: 3000 });
  }

  showSuccess(msg: string) {
    this.snackBar.open(msg, 'Close', { duration: 3000 });
  }
}

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'seller-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data?.seller ? 'Edit Seller' : 'Add New Seller' }}</h2>
    <mat-dialog-content>
      <div class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput [(ngModel)]="formData.name" required>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput type="email" [(ngModel)]="formData.email">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Phone</mat-label>
          <input matInput [(ngModel)]="formData.phone">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Address</mat-label>
          <input matInput [(ngModel)]="formData.address">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>City</mat-label>
          <input matInput [(ngModel)]="formData.city">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Country</mat-label>
          <input matInput [(ngModel)]="formData.country">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput [(ngModel)]="formData.notes" rows="3"></textarea>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="!formData.name">Save</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .full-width { grid-column: 1 / -1; }
    mat-form-field { width: 100%; }
  `]
})
export class SellerFormDialogComponent {
  formData: any = {
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    notes: ''
  };

  constructor(
    public dialogRef: MatDialogRef<SellerFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data?.seller) {
      this.formData = { ...data.seller };
    }
  }

  save() {
    this.dialogRef.close(this.formData);
  }
}