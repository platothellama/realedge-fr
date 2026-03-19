import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-wizard-search-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <div class="header-icon">
          <mat-icon>tune</mat-icon>
        </div>
        <h2>Wizard Search</h2>
        <p>Use structured filters to find matching properties</p>
      </div>

      <div class="dialog-content">
        <div class="filters-section">
          <h4>Current Filters</h4>
          
          @if (preference) {
            <div class="filter-list">
              @if (preference.budgetMin || preference.budgetMax) {
                <div class="filter-item">
                  <mat-icon>attach_money</mat-icon>
                  <span class="filter-label">Budget</span>
                  <span class="filter-value">\${{ preference.budgetMin || 0 }} - \${{ preference.budgetMax || 'any' }}</span>
                </div>
              }
              @if (preference.bedrooms) {
                <div class="filter-item">
                  <mat-icon>bed</mat-icon>
                  <span class="filter-label">Bedrooms</span>
                  <span class="filter-value">{{ preference.bedrooms }}+</span>
                </div>
              }
              @if (preference.bathrooms) {
                <div class="filter-item">
                  <mat-icon>bathtub</mat-icon>
                  <span class="filter-label">Bathrooms</span>
                  <span class="filter-value">{{ preference.bathrooms }}+</span>
                </div>
              }
              @if (preference.propertyType) {
                <div class="filter-item">
                  <mat-icon>home</mat-icon>
                  <span class="filter-label">Type</span>
                  <span class="filter-value">{{ preference.propertyType }}</span>
                </div>
              }
              @if (preference.preferredLocations?.length) {
                <div class="filter-item">
                  <mat-icon>location_on</mat-icon>
                  <span class="filter-label">Locations</span>
                  <span class="filter-value">{{ preference.preferredLocations.join(', ') }}</span>
                </div>
              }
              @if (preference.parkingRequired) {
                <div class="filter-item">
                  <mat-icon>local_parking</mat-icon>
                  <span class="filter-label">Parking</span>
                  <span class="filter-value">Required</span>
                </div>
              }
              
              @if (!preference.budgetMin && !preference.budgetMax && !preference.bedrooms && !preference.propertyType && !preference.preferredLocations?.length && !preference.parkingRequired) {
                <div class="no-filters">
                  <mat-icon>info</mat-icon>
                  <span>No specific filters - will match all available properties</span>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <div class="dialog-actions">
        <button mat-stroked-button (click)="close()">Cancel</button>
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
      min-width: 500px;
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
    }
    
    .filters-section h4 {
      margin: 0 0 16px 0;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
    }
    
    .filter-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .filter-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--bg-elevated);
      border-radius: 10px;
    }
    
    .filter-item mat-icon {
      color: #3b82f6;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    
    .filter-label {
      color: var(--text-secondary);
      font-size: 13px;
      min-width: 80px;
    }
    
    .filter-value {
      color: var(--text-primary);
      font-weight: 600;
      font-size: 14px;
      margin-left: auto;
    }
    
    .no-filters {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: var(--bg-elevated);
      border-radius: 10px;
      color: var(--text-muted);
      font-style: italic;
    }
    
    .no-filters mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
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
export class WizardSearchDialogComponent {
  preference: any;
  loading = false;

  constructor(
    public dialogRef: MatDialogRef<WizardSearchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private apiService: ApiService
  ) {
    this.preference = data?.preference;
  }

  search() {
    this.loading = true;
    this.dialogRef.close({ action: 'search', preferenceId: this.preference?.id });
  }

  close() {
    this.dialogRef.close(null);
  }
}
