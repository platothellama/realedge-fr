import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

export interface SearchFilterConfig {
  showSearch?: boolean;
  showStatus?: boolean;
  showType?: boolean;
  showListingType?: boolean;
  showCity?: boolean;
  showBedrooms?: boolean;
  showBathrooms?: boolean;
  showPrice?: boolean;
  showArea?: boolean;
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
  groupFilter?: string;
  userFilter?: string;
  sellerFilter?: string;
  propertyFilter?: string;
}

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
export class PropertySearchComponent implements OnInit {
  private api = inject(ApiService);

  groups: any[] = [];
  users: any[] = [];
  sellers: any[] = [];
  properties: any[] = [];
  loadingGroups = false;
  loadingUsers = false;
  loadingSellers = false;
  loadingProperties = false;

  @Input() config: SearchFilterConfig = {
    showSearch: true,
    showStatus: true,
    showType: true,
    showCity: true,
    showBedrooms: true,
    showBathrooms: true,
    showPrice: true,
    showArea: true
  };

  @Input() filters: SearchFilters = {
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
    maxArea: null,
    groupFilter: '',
    userFilter: '',
    sellerFilter: '',
    propertyFilter: ''
  };

  @Input() statusOptions: string[] = ['All', 'Available', 'Sold', 'Reserved', 'Rented'];
  @Input() typeOptions: string[] = ['All', 'Apartment', 'House', 'Villa', 'Office', 'Land', 'Commercial'];
  @Input() listingTypeOptions: string[] = ['All', 'Sale', 'Rent'];
  @Input() cityOptions: string[] = ['All', 'Beirut', 'Mount Lebanon', 'North Lebanon', 'South Lebanon', 'Bekaa', 'Nabatieh', 'Keserwan', 'Jbeil', 'Tripoli', 'Sidon', 'Tyre'];

  @Output() filtersChange = new EventEmitter<SearchFilters>();
  @Output() search = new EventEmitter<void>();

  showAdvancedFilters = false;
  private searchDebounce: any;

  ngOnInit() {
    this.loadGroups();
    this.loadUsers();
    this.loadSellers();
    this.loadProperties();
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

  clearFilters() {
    this.filters = {
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
      maxArea: null,
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
    return !!(
      this.filters.searchQuery ||
      this.filters.selectedStatus !== 'All' ||
      this.filters.selectedType !== 'All' ||
      this.filters.selectedCity !== 'All' ||
      this.filters.minBedrooms ||
      this.filters.maxBedrooms ||
      this.filters.minBathrooms ||
      this.filters.minPrice ||
      this.filters.maxPrice ||
      this.filters.minArea ||
      this.filters.maxArea ||
      this.filters.groupFilter ||
      this.filters.userFilter ||
      this.filters.sellerFilter ||
      this.filters.propertyFilter
    );
  }

  private emitChanges() {
    this.filtersChange.emit(this.filters);
    this.search.emit();
  }
}
