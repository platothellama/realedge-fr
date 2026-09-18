import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api';

export interface SearchFilterConfig {
  showSearch?: boolean;
  showStatus?: boolean;
  showType?: boolean;
  showListingType?: boolean;
  showCondition?: boolean;
  showCity?: boolean;
  showCountry?: boolean;
  showBedrooms?: boolean;
  showBathrooms?: boolean;
  showBalconies?: boolean;
  showParking?: boolean;
  showFloor?: boolean;
  showYearBuilt?: boolean;
  showLotSize?: boolean;
  showMasterBedrooms?: boolean;
  showTerraceCellar?: boolean;
  showFeatures?: boolean;
  showPrice?: boolean;
  showArea?: boolean;
  showProject?: boolean;
  showSellerSelect?: boolean;
  showAgent?: boolean;
  showSort?: boolean;
  showGroup?: boolean;
  showUser?: boolean;
  showSeller?: boolean;
  showProperty?: boolean;
}

export interface SearchFilters {
  searchQuery: string;
  selectedStatus: string;
  selectedType: string;
  selectedListingType: string;
  selectedCity: string;
  minBedrooms: number | null;
  maxBedrooms: number | null;
  minBathrooms: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  minArea: number | null;
  maxArea: number | null;
  // Optional extended filters (defaulted via EMPTY_SEARCH_FILTERS).
  selectedCondition?: string;
  selectedCountry?: string;
  maxBathrooms?: number | null;
  minBalconies?: number | null;
  maxBalconies?: number | null;
  minParking?: number | null;
  maxParking?: number | null;
  minFloor?: number | null;
  maxFloor?: number | null;
  minYearBuilt?: number | null;
  maxYearBuilt?: number | null;
  minLotSize?: number | null;
  maxLotSize?: number | null;
  minMasterBedrooms?: number | null;
  hasTerrace?: boolean | null;
  hasCellar?: boolean | null;
  feature?: string;
  projectId?: string;
  sellerId?: string;
  assignedToUserId?: string;
  sortBy?: string;
  sortDir?: string;
  groupFilter?: string;
  userFilter?: string;
  sellerFilter?: string;
  propertyFilter?: string;
}

export const EMPTY_SEARCH_FILTERS: SearchFilters = {
  searchQuery: '',
  selectedStatus: 'All',
  selectedType: 'All',
  selectedListingType: 'All',
  selectedCondition: 'All',
  selectedCity: 'All',
  selectedCountry: 'All',
  minBedrooms: null,
  maxBedrooms: null,
  minBathrooms: null,
  maxBathrooms: null,
  minBalconies: null,
  maxBalconies: null,
  minParking: null,
  maxParking: null,
  minFloor: null,
  maxFloor: null,
  minYearBuilt: null,
  maxYearBuilt: null,
  minLotSize: null,
  maxLotSize: null,
  minMasterBedrooms: null,
  hasTerrace: null,
  hasCellar: null,
  feature: '',
  minPrice: null,
  maxPrice: null,
  minArea: null,
  maxArea: null,
  projectId: 'All',
  sellerId: 'All',
  assignedToUserId: 'All',
  sortBy: 'createdAt',
  sortDir: 'DESC',
  groupFilter: '',
  userFilter: '',
  sellerFilter: '',
  propertyFilter: ''
};

@Component({
  selector: 'app-property-search',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './property-search.html',
  styleUrl: './property-search.css',
})
export class PropertySearchComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);

  groups: any[] = [];
  users: any[] = [];
  sellers: any[] = [];
  properties: any[] = [];
  projects: any[] = [];
  availableFeatures: string[] = [];
  loadingGroups = false;
  loadingUsers = false;
  loadingSellers = false;
  loadingProperties = false;
  loadingProjects = false;
  loadingFeatures = false;

  @Input() config: SearchFilterConfig = {
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
    showSort: true
  };

  @Input() filters: SearchFilters = { ...EMPTY_SEARCH_FILTERS };

  @Input() statusOptions: string[] = ['All', 'Available', 'Sold', 'Reserved', 'Rented', 'Lost'];
  @Input() typeOptions: string[] = ['All', 'Apartment', 'House', 'Villa', 'Office', 'Land', 'Commercial'];
  @Input() listingTypeOptions: string[] = ['All', 'Sale', 'Rent'];
  @Input() conditionOptions: string[] = ['All', 'Used', 'New'];
  @Input() cityOptions: string[] = ['All', 'Beirut', 'Mount Lebanon', 'North Lebanon', 'South Lebanon', 'Bekaa', 'Nabatieh', 'Keserwan', 'Jbeil', 'Tripoli', 'Sidon', 'Tyre'];
  @Input() countryOptions: string[] = ['All', 'Lebanon', 'UAE', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Cyprus', 'Greece', 'France', 'UK', 'USA'];
  @Input() sortOptions: { value: string; label: string }[] = [
    { value: 'createdAt', label: 'Newest' },
    { value: 'price', label: 'Price' },
    { value: 'area', label: 'Area' },
    { value: 'bedrooms', label: 'Bedrooms' },
    { value: 'bathrooms', label: 'Bathrooms' },
    { value: 'yearBuilt', label: 'Year built' },
  ];

  @Output() filtersChange = new EventEmitter<SearchFilters>();
  @Output() search = new EventEmitter<void>();

  showAdvancedFilters = false;
  projectSearch = '';
  sellerSearch = '';
  agentSearch = '';
  private searchDebounce: any;

  ngOnInit() {
    this.loadGroups();
    this.loadUsers();
    this.loadSellers();
    this.loadProperties();
    this.loadProjects();
    this.loadFeatures();
    // Back-fill defaults for filter objects created before new fields existed.
    this.filters = { ...EMPTY_SEARCH_FILTERS, ...this.filters };
  }

  loadProjects() {
    if (!this.config.showProject) return;
    this.loadingProjects = true;
    this.api.getProjects().subscribe({
      next: (res: any) => {
        this.projects = Array.isArray(res) ? res : (res?.data || []);
        this.loadingProjects = false;
      },
      error: () => this.loadingProjects = false
    });
  }

  loadFeatures() {
    if (!this.config.showFeatures) return;
    this.loadingFeatures = true;
    this.api.getUniqueFeatures().subscribe({
      next: (res: any) => {
        this.availableFeatures = Array.isArray(res) ? res : [];
        this.loadingFeatures = false;
      },
      error: () => this.loadingFeatures = false
    });
  }

  loadGroups() {
    if (!this.config.showGroup) return;
    this.loadingGroups = true;
    this.api.getGroups().subscribe({
      next: (res: any) => {
        this.groups = Array.isArray(res) ? res : (res?.data || []);
        this.loadingGroups = false;
      },
      error: () => this.loadingGroups = false
    });
  }

  loadUsers() {
    if (!this.config.showUser) return;
    this.loadingUsers = true;
    this.api.getUsers().subscribe({
      next: (res: any) => {
        this.users = Array.isArray(res) ? res : (res?.data || []);
        this.loadingUsers = false;
      },
      error: () => this.loadingUsers = false
    });
  }

  loadSellers() {
    if (!this.config.showSeller) return;
    this.loadingSellers = true;
    this.api.getSellers().subscribe({
      next: (res: any) => {
        this.sellers = Array.isArray(res) ? res : (res?.data || []);
        this.loadingSellers = false;
      },
      error: () => this.loadingSellers = false
    });
  }

  loadProperties() {
    if (!this.config.showProperty) return;
    this.loadingProperties = true;
    this.api.getProperties({ limit: 100 }).subscribe({
      next: (res: any) => {
        this.properties = Array.isArray(res) ? res : (res?.data || []);
        this.loadingProperties = false;
      },
      error: () => this.loadingProperties = false
    });
  }

  ngOnDestroy() {
    // QA fix 2026-09-18: a pending debounce must not emit after destroy.
    clearTimeout(this.searchDebounce);
  }

  onSearchInput() {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.emitChanges();
    }, 400);
  }

  onFilterChange() {
    this.emitChanges();
  }

  setPriceRange(min: number | null, max: number | null) {
    this.filters.minPrice = min;
    this.filters.maxPrice = max;
    this.emitChanges();
  }

  setAreaRange(min: number | null, max: number | null) {
    this.filters.minArea = min;
    this.filters.maxArea = max;
    this.emitChanges();
  }

  setSort(sortBy: string) {
    if (this.filters.sortBy === sortBy) {
      this.filters.sortDir = this.filters.sortDir === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.filters.sortBy = sortBy;
      this.filters.sortDir = sortBy === 'createdAt' ? 'DESC' : 'ASC';
    }
    this.emitChanges();
  }

  sortLabel(): string {
    const found = this.sortOptions.find(o => o.value === this.filters.sortBy);
    const dir = this.filters.sortDir === 'ASC' ? '↑' : '↓';
    return found ? `${found.label} ${dir}` : 'Sort';
  }

  projectName(): string {
    if (!this.filters.projectId || this.filters.projectId === 'All') return '';
    if (this.filters.projectId === 'unassigned') return 'Standalone';
    return this.projects.find((p: any) => p.id === this.filters.projectId)?.name || 'Project';
  }

  sellerName(): string {
    if (!this.filters.sellerId || this.filters.sellerId === 'All') return '';
    return this.sellers.find((s: any) => s.id === this.filters.sellerId)?.name || 'Seller';
  }

  agentName(): string {
    if (!this.filters.assignedToUserId || this.filters.assignedToUserId === 'All') return '';
    return this.users.find((u: any) => u.id === this.filters.assignedToUserId)?.name || 'Agent';
  }

  userDisplayName(u: any): string {
    return u?.name || u?.email || 'Agent';
  }

  activeFilterCount(): number {
    let n = 0;
    const f = this.filters;
    if (f.searchQuery) n++;
    if (f.selectedStatus !== 'All') n++;
    if (f.selectedType !== 'All') n++;
    if (f.selectedListingType !== 'All') n++;
    if (f.selectedCondition != null && f.selectedCondition !== 'All') n++;
    if (f.selectedCity !== 'All') n++;
    if (f.selectedCountry != null && f.selectedCountry !== 'All') n++;
    if (f.minBedrooms != null || f.maxBedrooms != null) n++;
    if (f.minBathrooms != null || f.maxBathrooms != null) n++;
    if (f.minBalconies != null || f.maxBalconies != null) n++;
    if (f.minParking != null || f.maxParking != null) n++;
    if (f.minFloor != null || f.maxFloor != null) n++;
    if (f.minYearBuilt != null || f.maxYearBuilt != null) n++;
    if (f.minLotSize != null || f.maxLotSize != null) n++;
    if (f.minMasterBedrooms != null) n++;
    if (f.hasTerrace != null) n++;
    if (f.hasCellar != null) n++;
    if (f.feature) n++;
    if (f.minPrice != null || f.maxPrice != null) n++;
    if (f.minArea != null || f.maxArea != null) n++;
    if (f.projectId && f.projectId !== 'All') n++;
    if (f.sellerId && f.sellerId !== 'All') n++;
    if (f.assignedToUserId && f.assignedToUserId !== 'All') n++;
    if (f.groupFilter || f.userFilter || f.sellerFilter || f.propertyFilter) n++;
    return n;
  }

  hasAdvancedFilters(): boolean {
    const c = this.config;
    return !!(c.showBedrooms || c.showBathrooms || c.showBalconies || c.showParking ||
      c.showFloor || c.showYearBuilt || c.showLotSize || c.showMasterBedrooms ||
      c.showTerraceCellar || c.showFeatures || c.showPrice || c.showArea || c.showSort);
  }

  clearFilters() {
    const keepSortBy = this.filters.sortBy;
    const keepSortDir = this.filters.sortDir;
    this.filters = {
      ...EMPTY_SEARCH_FILTERS,
      sortBy: keepSortBy,
      sortDir: keepSortDir,
      groupFilter: '',
      userFilter: '',
      sellerFilter: '',
      propertyFilter: ''
    };
    this.emitChanges();
  }

  clearSearch() {
    this.filters.searchQuery = '';
    this.emitChanges();
  }

  hasActiveFilters(): boolean {
    return this.activeFilterCount() > 0;
  }

  private emitChanges() {
    this.filtersChange.emit(this.filters);
    this.search.emit();
  }
}
