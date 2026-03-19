import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../services/api';
import { WizardSearchDialogComponent } from '../../components/wizard-search-dialog/wizard-search-dialog';
import { NaturalSearchDialogComponent } from '../../components/natural-search-dialog/natural-search-dialog';

interface SavedSearch {
  preferenceId: string;
  matches: any[];
  totalFound: number;
  aiExplanation: string;
  searchType: 'wizard' | 'natural';
  timestamp: number;
}

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
    MatDialogModule,
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
  hasSearched = false;
  searchType: 'wizard' | 'natural' | null = null;
  lastSearchQuery = '';

  private readonly STORAGE_KEY = 'property_matcher_search';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.preferenceId = params['id'];
      if (this.preferenceId) {
        this.loadPreference();
        this.loadSavedSearch();
      }
    });
  }

  loadPreference() {
    this.loading = true;
    this.apiService.getBuyerPreferenceById(this.preferenceId).subscribe({
      next: (data) => {
        this.preference = data;
        this.loading = false;
      },
      error: (err) => {
        this.showError('Failed to load buyer preference');
        this.loading = false;
      }
    });
  }

  private loadSavedSearch() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const data: SavedSearch = JSON.parse(saved);
        if (data.preferenceId === this.preferenceId) {
          this.matches = (data.matches || []).filter((m: any) => m && m.property);
          this.totalFound = data.totalFound || 0;
          this.aiExplanation = data.aiExplanation || '';
          this.searchType = data.searchType;
          this.hasSearched = this.matches.length > 0;
        }
      }
    } catch (e) {
      console.error('Failed to load saved search', e);
    }
  }

  private saveSearch() {
    try {
      const data: SavedSearch = {
        preferenceId: this.preferenceId,
        matches: this.matches,
        totalFound: this.totalFound,
        aiExplanation: this.aiExplanation,
        searchType: this.searchType as 'wizard' | 'natural',
        timestamp: Date.now()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save search', e);
    }
  }

  openWizardSearch() {
    if (!this.preference) {
      this.showError('Please wait, loading preference...');
      return;
    }
    const dialogRef = this.dialog.open(WizardSearchDialogComponent, {
      data: { preference: this.preference },
      panelClass: 'dark-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.action === 'search') {
        this.matchProperties();
      }
    });
  }

  openNaturalSearch() {
    const dialogRef = this.dialog.open(NaturalSearchDialogComponent, {
      data: {},
      panelClass: 'dark-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.query) {
        this.performNaturalSearch(result.query);
      }
    });
  }

  matchProperties() {
    this.loading = true;
    this.searchType = 'wizard';
    this.apiService.matchPropertiesToBuyer(this.preferenceId).subscribe({
      next: (data) => {
        this.matches = (data.matches || []).filter((m: any) => m && m.property);
        this.totalFound = data.totalFound || 0;
        this.aiExplanation = data.aiExplanation || '';
        this.hasSearched = true;
        this.saveSearch();
        this.loading = false;
      },
      error: (err) => {
        this.showError('Failed to match properties');
        this.loading = false;
      }
    });
  }

  performNaturalSearch(query: string) {
    this.searchLoading = true;
    this.searchType = 'natural';
    this.lastSearchQuery = query;
    this.apiService.naturalLanguageSearch({ 
      query: query,
      filters: {}
    }).subscribe({
      next: (data) => {
        this.matches = (data.results || []).filter((m: any) => m && m.property);
        this.totalFound = data.totalFound || 0;
        this.hasSearched = true;
        this.saveSearch();
        
        const parsed = data.parsedFilters || {};
        let explanation = `Natural language search results for: "${query}"`;
        
        if (parsed.priceRange) {
          explanation += `\nPrice range detected: $${parsed.priceRange.min || 0} - $${parsed.priceRange.max || 'any'}`;
        }
        if (parsed.bedrooms) {
          explanation += `\nBedrooms: ${parsed.bedrooms}+`;
        }
        if (parsed.features?.length > 0) {
          explanation += `\nFeatures: ${parsed.features.join(', ')}`;
        }
        
        this.aiExplanation = explanation;
        this.searchLoading = false;
      },
      error: (err) => {
        this.showError('Search failed');
        this.searchLoading = false;
      }
    });
  }

  clearResults() {
    this.matches = [];
    this.hasSearched = false;
    this.searchType = null;
    this.aiExplanation = '';
    this.lastSearchQuery = '';
    localStorage.removeItem(this.STORAGE_KEY);
  }

  rerunSearch() {
    if (this.searchType === 'wizard') {
      this.matchProperties();
    } else if (this.searchType === 'natural' && this.lastSearchQuery) {
      this.performNaturalSearch(this.lastSearchQuery);
    }
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
    if (property?.photos && property.photos.length > 0) {
      return property.photos[0];
    }
    return '';
  }

  viewPropertyDetails(propertyId: string) {
    if (propertyId) {
      this.router.navigate(['/properties', propertyId]);
    }
  }

  goBack() {
    this.router.navigate(['/buyer-preferences']);
  }

  private showError(message: string) {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
}
