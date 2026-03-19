import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService } from '../../services/api';

interface WizardFilters {
  budgetMin: number | null;
  budgetMax: number | null;
  propertyType: string;
  bedrooms: number | null;
  bathrooms: number | null;
  preferredLocations: string;
  parkingRequired: boolean;
  balconyRequired: boolean;
  furnishedRequired: boolean;
}

@Component({
  selector: 'app-wizard-search-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <div class="header-icon">
          <mat-icon>tune</mat-icon>
        </div>
        <h2>Wizard Search</h2>
        <p>Configure filters to find matching properties</p>
      </div>

      <div class="dialog-content">
        <div class="filters-grid">
          <div class="filter-group">
            <label>Budget Range</label>
            <div class="range-inputs">
              <mat-form-field appearance="outline">
                <mat-label>Min</mat-label>
                <input matInput type="number" [(ngModel)]="filters.budgetMin" placeholder="0">
              </mat-form-field>
              <span class="range-separator">to</span>
              <mat-form-field appearance="outline">
                <mat-label>Max</mat-label>
                <input matInput type="number" [(ngModel)]="filters.budgetMax" placeholder="Any">
              </mat-form-field>
            </div>
          </div>

          <div class="filter-group">
            <label>Property Type</label>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Select type</mat-label>
              <mat-select [(ngModel)]="filters.propertyType">
                <mat-option value="">Any</mat-option>
                @for (type of propertyTypes; track type) {
                  <mat-option [value]="type">{{ type }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <div class="filter-group">
            <label>Bedrooms</label>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Min bedrooms</mat-label>
              <mat-select [(ngModel)]="filters.bedrooms">
                <mat-option [value]="null">Any</mat-option>
                @for (num of bedroomOptions; track num) {
                  <mat-option [value]="num">{{ num }}+</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <div class="filter-group">
            <label>Bathrooms</label>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Min bathrooms</mat-label>
              <mat-select [(ngModel)]="filters.bathrooms">
                <mat-option [value]="null">Any</mat-option>
                @for (num of bathroomOptions; track num) {
                  <mat-option [value]="num">{{ num }}+</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <div class="filter-group full-width">
            <label>Locations</label>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Cities (comma separated)</mat-label>
              <input matInput [(ngModel)]="filters.preferredLocations" placeholder="Beirut, Jounieh...">
            </mat-form-field>
          </div>

          <div class="filter-group full-width">
            <label>Required Features</label>
            <div class="checkbox-group">
              <mat-checkbox [(ngModel)]="filters.parkingRequired">Parking</mat-checkbox>
              <mat-checkbox [(ngModel)]="filters.balconyRequired">Balcony</mat-checkbox>
              <mat-checkbox [(ngModel)]="filters.furnishedRequired">Furnished</mat-checkbox>
            </div>
          </div>
        </div>

        <div class="active-filters" *ngIf="hasActiveFilters">
          <span class="filters-label">Active Filters:</span>
          <mat-chip-set>
            <mat-chip *ngIf="filters.budgetMin || filters.budgetMax">
              <mat-icon>attach_money</mat-icon>
              \${{ filters.budgetMin || 0 }} - \${{ filters.budgetMax || 'any' }}
            </mat-chip>
            <mat-chip *ngIf="filters.propertyType">
              <mat-icon>home</mat-icon>
              {{ filters.propertyType }}
            </mat-chip>
            <mat-chip *ngIf="filters.bedrooms">
              <mat-icon>bed</mat-icon>
              {{ filters.bedrooms }}+ beds
            </mat-chip>
            <mat-chip *ngIf="filters.bathrooms">
              <mat-icon>bathtub</mat-icon>
              {{ filters.bathrooms }}+ baths
            </mat-chip>
            <mat-chip *ngIf="filters.preferredLocations">
              <mat-icon>location_on</mat-icon>
              {{ filters.preferredLocations }}
            </mat-chip>
            <mat-chip *ngIf="filters.parkingRequired">Parking</mat-chip>
            <mat-chip *ngIf="filters.balconyRequired">Balcony</mat-chip>
            <mat-chip *ngIf="filters.furnishedRequired">Furnished</mat-chip>
          </mat-chip-set>
        </div>
      </div>

      <div class="dialog-actions">
        <button mat-button (click)="close()">Cancel</button>
        <button mat-raised-button color="primary" (click)="search()" [disabled]="loading">
          @if (loading) {
            <mat-spinner diameter="20"></mat-spinner>
            <span>Searching...</span>
          } @else {
            <mat-icon>search</mat-icon>
            <span>Find Properties</span>
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 0;
      min-width: 550px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
    }
    
    .dialog-header {
      text-align: center;
      padding: 24px;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1));
      border-bottom: 1px solid var(--border);
    }
    
    .header-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(59, 130, 246, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }
    
    .header-icon mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #3b82f6;
    }
    
    .dialog-header h2 {
      margin: 0 0 4px 0;
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
    }
    
    .dialog-header p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 14px;
    }
    
    .dialog-content {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    }
    
    .filters-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    
    .filter-group {
      display: flex;
      flex-direction: column;
    }
    
    .filter-group.full-width {
      grid-column: 1 / -1;
    }
    
    .filter-group label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
      margin-bottom: 8px;
      font-weight: 600;
    }
    
    .range-inputs {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .range-inputs mat-form-field {
      flex: 1;
    }
    
    .range-separator {
      color: var(--text-muted);
      font-size: 14px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .checkbox-group {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
    }
    
    .checkbox-group mat-checkbox {
      margin-bottom: 8px;
    }
    
    .active-filters {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }
    
    .filters-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
      font-weight: 600;
      display: block;
      margin-bottom: 8px;
    }
    
    .active-filters mat-chip {
      margin: 4px;
    }
    
    .active-filters mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }
    
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid var(--border);
      background: var(--bg-surface);
    }
    
    .dialog-actions button mat-icon {
      margin-right: 8px;
    }
    
    .dialog-actions button mat-spinner {
      margin-right: 8px;
    }
  `]
})
export class WizardSearchDialogComponent implements OnInit {
  preference: any;
  savedFilters: any;
  loading = false;
  
  filters: WizardFilters = {
    budgetMin: null,
    budgetMax: null,
    propertyType: '',
    bedrooms: null,
    bathrooms: null,
    preferredLocations: '',
    parkingRequired: false,
    balconyRequired: false,
    furnishedRequired: false
  };
  
  propertyTypes = ['Apartment', 'House', 'Villa', 'Office', 'Land', 'Commercial'];
  bedroomOptions = [1, 2, 3, 4, 5, 6];
  bathroomOptions = [1, 2, 3, 4, 5];
  
  constructor(
    public dialogRef: MatDialogRef<WizardSearchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private apiService: ApiService
  ) {
    this.preference = data?.preference;
    this.savedFilters = data?.savedFilters || null;
  }
  
  ngOnInit() {
    const sourceFilters = this.savedFilters || this.preference;
    
    if (sourceFilters) {
      this.filters.budgetMin = sourceFilters.budgetMin || null;
      this.filters.budgetMax = sourceFilters.budgetMax || null;
      this.filters.propertyType = sourceFilters.propertyType || '';
      this.filters.bedrooms = sourceFilters.bedrooms || null;
      this.filters.bathrooms = sourceFilters.bathrooms || null;
      this.filters.preferredLocations = sourceFilters.preferredLocations 
        ? (Array.isArray(sourceFilters.preferredLocations) 
          ? sourceFilters.preferredLocations.join(', ') 
          : sourceFilters.preferredLocations)
        : '';
      this.filters.parkingRequired = sourceFilters.parkingRequired || false;
      this.filters.balconyRequired = sourceFilters.balconyRequired || false;
      this.filters.furnishedRequired = sourceFilters.furnishedRequired || false;
    }
  }
  
  get hasActiveFilters(): boolean {
    return !!(
      this.filters.budgetMin || 
      this.filters.budgetMax || 
      this.filters.propertyType ||
      this.filters.bedrooms ||
      this.filters.bathrooms ||
      this.filters.preferredLocations ||
      this.filters.parkingRequired ||
      this.filters.balconyRequired ||
      this.filters.furnishedRequired
    );
  }
  
  search() {
    this.loading = true;
    
    const data: any = {
      budgetMin: this.filters.budgetMin,
      budgetMax: this.filters.budgetMax,
      propertyType: this.filters.propertyType || null,
      bedrooms: this.filters.bedrooms,
      bathrooms: this.filters.bathrooms,
      preferredLocations: this.filters.preferredLocations 
        ? this.filters.preferredLocations.split(',').map((l: string) => l.trim()).filter((l: string) => l)
        : [],
      parkingRequired: this.filters.parkingRequired,
      balconyRequired: this.filters.balconyRequired,
      furnishedRequired: this.filters.furnishedRequired
    };
    
    this.apiService.wizardSearch(this.preference.id, data).subscribe({
      next: (result) => {
        this.loading = false;
        this.dialogRef.close({
          action: 'search',
          filters: this.filters,
          results: result
        });
      },
      error: (err) => {
        this.loading = false;
        console.error('Search failed:', err);
        this.dialogRef.close({ action: 'error', message: 'Search failed' });
      }
    });
  }
  
  close() {
    this.dialogRef.close(null);
  }
}
