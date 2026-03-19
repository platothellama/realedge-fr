import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GoogleMapsModule } from '@angular/google-maps';
import { ApiService } from '../../services/api';
import { PropertyFormComponent } from '../../components/property-form/property-form';

@Component({
  selector: 'app-properties',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    CommonModule,
    MatDialogModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    FormsModule,
    GoogleMapsModule
  ],
  templateUrl: './properties.html',
  styleUrl: './properties.css',
})
export class PropertiesComponent implements OnInit {
  properties: any[] = [];
  filteredProperties: any[] = [];
  loading = false;
  deletingId: string | null = null;

  // Search & Map Filters
  searchQuery: string = '';
  selectedType: string = 'All';
  selectedStatus: string = 'All';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  minBedrooms: number | null = null;
  minBathrooms: number | null = null;
  minArea: number | null = null;
  maxArea: number | null = null;

  isMapView: boolean = false;
  isFiltersExpanded: boolean = false;
  searchRadius: number = 10; // Default 10km
  searchCenterMarker: google.maps.LatLngLiteral | null = null;

  // Map Config
  mapCenter: google.maps.LatLngLiteral = { lat: 25.2048, lng: 55.2708 };
  mapZoom = 10;
  mapOptions: google.maps.MapOptions = {
    mapTypeId: 'roadmap',
    styles: [
      { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    ]
  };
  circleOptions = {
    fillColor: '#6366f1',
    fillOpacity: 0.2,
    strokeColor: '#6366f1',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    clickable: false
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
    this.apiService.getProperties().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.properties = data;
        } else {
          this.properties = this.getMockProperties();
        }
        this.applyFilters();
      },
      error: (err) => {
        console.error('Failed to fetch properties', err);
        this.properties = this.getMockProperties();
        this.applyFilters();
      }
    });
  }

  applyFilters() {
    this.filteredProperties = this.properties;
    this.applyMapFilter();
  }

  toggleMapView() {
    this.isMapView = !this.isMapView;
    if (this.isMapView && this.properties.length > 0 && !this.searchCenterMarker) {
      // Auto-center map on first property if no center selected
      const firstValid = this.properties.find(p => p.lat && p.lng);
      if (firstValid) {
        this.mapCenter = { lat: Number(firstValid.lat), lng: Number(firstValid.lng) };
      }
    }
  }

  onMainMapClick(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      this.searchCenterMarker = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      };
      this.applyMapFilter();
    }
  }

  applyMapFilter() {
    let results = [...this.properties];

    // Filter by Type
    if (this.selectedType && this.selectedType !== 'All') {
      results = results.filter(p => p.type === this.selectedType);
    }

    // Filter by Status
    if (this.selectedStatus && this.selectedStatus !== 'All') {
      results = results.filter(p => p.status === this.selectedStatus);
    }

    // Filter by Price Range
    if (this.minPrice !== null && this.minPrice !== undefined) {
      results = results.filter(p => p.price >= this.minPrice!);
    }
    if (this.maxPrice !== null && this.maxPrice !== undefined) {
      results = results.filter(p => p.price <= this.maxPrice!);
    }

    // Filter by Bedrooms
    if (this.minBedrooms !== null && this.minBedrooms !== undefined) {
      results = results.filter(p => p.bedrooms >= this.minBedrooms!);
    }

    // Filter by Area Range
    if (this.minArea !== null && this.minArea !== undefined) {
      results = results.filter(p => p.area >= this.minArea!);
    }
    if (this.maxArea !== null && this.maxArea !== undefined) {
      results = results.filter(p => p.area <= this.maxArea!);
    }

    // Filter by Search Query
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      results = results.filter(p =>
        (p.title?.toLowerCase().includes(q)) ||
        (p.address?.toLowerCase().includes(q)) ||
        (p.city?.toLowerCase().includes(q)) ||
        (p.description?.toLowerCase().includes(q))
      );
    }

    // Map Radius Filter
    if (this.searchCenterMarker && this.searchRadius > 0) {
      results = results.filter(prop => {
        if (!prop.lat || !prop.lng) return false;
        const distance = this.calculateDistance(
          this.searchCenterMarker!.lat,
          this.searchCenterMarker!.lng,
          Number(prop.lat),
          Number(prop.lng)
        );
        return distance <= this.searchRadius;
      });
    }

    this.filteredProperties = results;
  }

  clearFilters() {
    this.selectedType = 'All';
    this.selectedStatus = 'All';
    this.minPrice = null;
    this.maxPrice = null;
    this.minBedrooms = null;
    this.minArea = null;
    this.maxArea = null;
    this.searchQuery = '';
    this.applyMapFilter();
  }

  // Haversine formula to calculate distance between two lat/lng pairs in KM
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  }

  parseNumber(val: any): number {
    return Number(val);
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

  private getMockProperties() {
    return [
      {
        id: '1',
        title: 'Penthouse with Panoramic City View',
        price: 1250000,
        address: 'Downtown Avenue',
        city: 'Dubai',
        country: 'UAE',
        bedrooms: 4,
        bathrooms: 3,
        area: 320,
        type: 'Apartment',
        status: 'Available',
        lat: 25.1972, // Burj Khalifa approx
        lng: 55.2744,
        photos: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80']
      },
      {
        id: '2',
        title: 'Ultra Luxury Beachfront Villa',
        price: 4500000,
        address: 'Palm Jumeirah',
        city: 'Dubai',
        country: 'UAE',
        bedrooms: 6,
        bathrooms: 7,
        area: 850,
        type: 'Villa',
        status: 'Reserved',
        lat: 25.1124, // Palm Jumeirah approx
        lng: 55.1390,
        photos: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80']
      }
    ];
  }
}
