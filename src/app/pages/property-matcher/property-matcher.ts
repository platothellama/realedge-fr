import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-property-matcher',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatExpansionModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule
  ],
  templateUrl: './property-matcher.html',
  styleUrl: './property-matcher.css',
})
export class PropertyMatcherComponent implements OnInit {
  preferenceId: string = '';
  preference: any = null;
  matches: any[] = [];
  loading = false;
  searchLoading = false;
  aiExplanation = '';
  totalFound = 0;
  parsedFilters: any = null;
  expandedQuery = '';

  nlQuery = '';
  showNlSearch = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.preferenceId = params['id'];
      if (this.preferenceId) {
        this.loadPreference();
      }
    });
  }

  loadPreference() {
    this.loading = true;
    
    this.apiService.getBuyerPreferenceById(this.preferenceId).subscribe({
      next: (data) => {
        this.preference = data;
        this.loading = false;
        if (data.matchCount && data.matchCount > 0) {
          this.totalFound = data.matchCount;
          this.aiExplanation = `Previously matched ${data.matchCount} properties on ${this.formatDate(data.lastMatchedAt)}`;
        }
      },
      error: (err) => {
        this.showError('Failed to load buyer preference');
        this.loading = false;
      }
    });
  }

  matchProperties() {
    this.loading = true;
    this.apiService.matchPropertiesToBuyer(this.preferenceId).subscribe({
      next: (data) => {
        this.matches = data.matches || [];
        this.totalFound = data.totalFound || 0;
        this.aiExplanation = data.aiExplanation || '';
        this.loading = false;
      },
      error: (err) => {
        this.showError('Failed to match properties');
        this.loading = false;
      }
    });
  }

  naturalLanguageSearch() {
    if (!this.nlQuery.trim()) {
      return;
    }

    this.searchLoading = true;
    this.apiService.naturalLanguageSearch({ 
      query: this.nlQuery,
      filters: {}
    }).subscribe({
      next: (data) => {
        this.matches = data.results || [];
        this.totalFound = data.totalFound || 0;
        this.parsedFilters = data.parsedFilters || null;
        this.expandedQuery = data.expandedQuery || '';
        this.aiExplanation = `Natural language search results for: "${this.nlQuery}"`;
        
        if (this.parsedFilters?.features?.length > 0) {
          this.aiExplanation += `\n\nDetected features: ${this.parsedFilters.features.join(', ')}`;
        }
        if (this.parsedFilters?.priceRange) {
          this.aiExplanation += `\nPrice range: $${this.parsedFilters.priceRange.min || 0} - $${this.parsedFilters.priceRange.max || 'any'}`;
        }
        
        this.searchLoading = false;
      },
      error: (err) => {
        this.showError('Search failed');
        this.searchLoading = false;
      }
    });
  }

  getScoreClass(score: number): string {
    if (score >= 0.8) return 'excellent';
    if (score >= 0.6) return 'good';
    if (score >= 0.4) return 'fair';
    return 'low';
  }

  getScorePercentage(score: number): number {
    return Math.round(score * 100);
  }

  getMainImage(property: any): string {
    if (property.photos && property.photos.length > 0) {
      return property.photos[0];
    }
    return '';
  }

  viewPropertyDetails(propertyId: string) {
    this.router.navigate(['/properties', propertyId]);
  }

  backToPreferences() {
    this.router.navigate(['/buyer-preferences']);
  }

  goBack() {
    this.router.navigate(['/buyer-preferences']);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  private showError(message: string) {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
}
