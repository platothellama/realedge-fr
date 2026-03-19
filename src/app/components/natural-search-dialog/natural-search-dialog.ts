import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-natural-search-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <div class="header-icon">
          <mat-icon>psychology</mat-icon>
        </div>
        <h2>Natural Language Search</h2>
        <p>Describe what you're looking for in plain English</p>
      </div>

      <div class="dialog-content">
        <div class="search-input-section">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Describe your ideal property</mat-label>
            <input matInput [(ngModel)]="query" (keyup.enter)="search()" 
              placeholder="e.g., modern apartment under $500k in Beirut with parking">
            <mat-icon matPrefix>search</mat-icon>
          </mat-form-field>
        </div>

        <div class="suggestions-section">
          <span class="suggestions-label">Try these examples:</span>
          <div class="suggestion-chips">
            <button class="suggestion-chip" (click)="setQuery('apartment under $500k in Beirut')">
              apartment under $500k in Beirut
            </button>
            <button class="suggestion-chip" (click)="setQuery('3 bedroom villa with pool')">
              3 bedroom villa with pool
            </button>
            <button class="suggestion-chip" (click)="setQuery('modern office near downtown')">
              modern office near downtown
            </button>
            <button class="suggestion-chip" (click)="setQuery('studio near university')">
              studio near university
            </button>
          </div>
        </div>
      </div>

      <div class="dialog-actions">
        <button mat-stroked-button (click)="close()" [disabled]="loading">Cancel</button>
        <button mat-raised-button color="primary" (click)="search()" [disabled]="!query.trim() || loading" [class.loading]="loading">
          @if (loading) {
            <mat-spinner diameter="20"></mat-spinner>
            <span>Searching...</span>
          } @else {
            <mat-icon>search</mat-icon>
            <span>Search</span>
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 0;
      min-width: 550px;
    }
    
    .dialog-header {
      text-align: center;
      padding: 24px;
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.1));
      border-bottom: 1px solid var(--border);
    }
    
    .header-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(139, 92, 246, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }
    
    .header-icon mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #8b5cf6;
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
    
    .search-input-section {
      margin-bottom: 20px;
    }
    
    .search-field {
      width: 100%;
    }
    
    .suggestions-section {
      padding: 16px;
      background: var(--bg-elevated);
      border-radius: 12px;
    }
    
    .suggestions-label {
      display: block;
      font-size: 12px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    
    .suggestion-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .suggestion-chip {
      padding: 8px 14px;
      border: 1px dashed var(--border-strong);
      border-radius: 20px;
      background: transparent;
      color: var(--text-secondary);
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .suggestion-chip:hover {
      border-color: #8b5cf6;
      color: #8b5cf6;
      background: rgba(139, 92, 246, 0.1);
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
export class NaturalSearchDialogComponent {
  query = '';
  loading = false;

  constructor(
    public dialogRef: MatDialogRef<NaturalSearchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  setQuery(q: string) {
    this.query = q;
    this.search();
  }

  search() {
    if (this.query.trim()) {
      this.dialogRef.close({ query: this.query });
    }
  }

  close() {
    this.dialogRef.close(null);
  }
}
