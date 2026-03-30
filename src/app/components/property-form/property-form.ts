import { Component, Inject, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GoogleMapsModule } from '@angular/google-maps';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth/auth.service';
import { SellerSelectorComponent, SellerSelection } from '../seller-selector/seller-selector';

@Component({
  selector: 'app-property-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    GoogleMapsModule,
    SellerSelectorComponent
  ],
  templateUrl: './property-form.html',
  styleUrl: './property-form.css'
})
export class PropertyFormComponent implements OnInit, AfterViewInit {
  propertyForm: FormGroup;
  isEdit = false;

  propertyTypes = ['Apartment', 'House', 'Villa', 'Office', 'Land', 'Commercial'];
  statuses = ['Available', 'Sold', 'Rented', 'Reserved'];
  listingTypes = ['Sale', 'Rent'];
  conditions = ['Used', 'New'];
  users: any[] = [];
  groups: any[] = [];

  // Media Uploads
  uploadedPhotos: string[] = [];
  isUploading = false;

  // Map options
  mapCenter: any = { lat: 25.2048, lng: 55.2708 };
  mapZoom = 12;
  markerPosition: any = null;
  mapOptions: any = {
    mapTypeId: 'roadmap',
    zoomControl: true,
    scrollwheel: true,
    disableDoubleClickZoom: true,
    styles: [
      { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    ]
  };

  isAdmin = false;
  isSubmitting = false;
  sellerSelection: SellerSelection | null = null;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PropertyFormComponent>,
    private api: ApiService,
    private auth: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    const user = this.auth.currentUser();
    this.isAdmin = user?.role === 'Super Admin' || user?.role === 'Admin';

    this.propertyForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      status: ['Available', Validators.required],
      type: ['Apartment', Validators.required],
      listingType: ['Sale', Validators.required],
      condition: ['Used', Validators.required],

      // Details
      bedrooms: [0],
      bathrooms: [0],
      area: [0],
      lotSize: [0],
      yearBuilt: [new Date().getFullYear()],
      parkingSpaces: [0],
      floor: [null],
      hasTerrace: [false],
      terraceSize: [0],

      // Location
      address: ['', Validators.required],
      city: ['', Validators.required],
      country: ['', Validators.required],
      lat: [null],
      lng: [null],

      // Assignments
      assignedToUserId: [null],
      assignedToGroupId: [null],
      sellerId: [null],
      commissionPercentage: [{ value: 0, disabled: !this.isAdmin }, [Validators.required, Validators.min(0), Validators.max(100)]],

      // Media (Strings for now, split by comma for array)
      photos: [''],
      videos: [''],
      tours360: [''],
      documents: [''],

      // Features
      features: ['']
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.loadUsers();
    this.loadGroups();
    this.handleEditMode();
    this.subscribeToLocationChanges();
  }

  private initForm() {
    this.propertyForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      status: ['Available', Validators.required],
      type: ['Apartment', Validators.required],
      listingType: ['Sale', Validators.required],
      condition: ['Used', Validators.required],
      bedrooms: [0],
      bathrooms: [0],
      area: [0],
      lotSize: [0],
      yearBuilt: [new Date().getFullYear()],
      parkingSpaces: [0],
      floor: [null],
      hasTerrace: [false],
      terraceSize: [0],
      address: ['', Validators.required],
      city: ['', Validators.required],
      country: ['', Validators.required],
      lat: [null],
      lng: [null],
      assignedToUserId: [null],
      assignedToGroupId: [null],
      sellerId: [null],
      commissionPercentage: [{ value: 0, disabled: !this.isAdmin }, [Validators.required, Validators.min(0), Validators.max(100)]],
      photos: [''],
      videos: [''],
      tours360: [''],
      documents: [''],
      features: ['']
    });
  }

  private loadUsers() {
    this.api.getUsers().subscribe({
      next: (res) => {
        this.users = Array.isArray(res) ? res : (res.data || []);
      },
      error: (err) => {
        console.error('Error fetching users', err);
        this.users = [];
      }
    });
  }

  private loadGroups() {
    this.api.getGroups().subscribe({
      next: (res: any) => {
        this.groups = Array.isArray(res) ? res : (res.data || []);
      },
      error: (err) => {
        console.error('Error fetching groups', err);
        this.groups = [];
      }
    });
  }

  private handleEditMode() {
    if (this.data && this.data.property) {
      this.isEdit = true;
      const prop = this.data.property;

      this.uploadedPhotos = prop.photos || [];

      this.propertyForm.patchValue({
        ...prop,
        photos: prop.photos?.join(', ') || '',
        videos: prop.videos?.join(', ') || '',
        tours360: prop.tours360?.join(', ') || '',
        documents: prop.documents?.join(', ') || '',
        features: prop.features?.join(', ') || ''
      });

      if (prop.lat && prop.lng) {
        this.mapCenter = { lat: parseFloat(prop.lat), lng: parseFloat(prop.lng) };
        this.markerPosition = { lat: parseFloat(prop.lat), lng: parseFloat(prop.lng) };
      }
    }
  }

  private subscribeToLocationChanges() {
    this.propertyForm.get('lat')?.valueChanges.subscribe(lat => {
      if (lat && this.propertyForm.get('lng')?.value) {
        this.updateMarkerFromInputs(lat, this.propertyForm.get('lng')?.value);
      }
    });

    this.propertyForm.get('lng')?.valueChanges.subscribe(lng => {
      if (lng && this.propertyForm.get('lat')?.value) {
        this.updateMarkerFromInputs(this.propertyForm.get('lat')?.value, lng);
      }
    });
  }

  ngAfterViewInit() {
    // If not edit mode and API loaded, could try to geolocate user here
  }

  updateMarkerFromInputs(lat: number, lng: number) {
     this.markerPosition = { lat: Number(lat), lng: Number(lng) };
     this.mapCenter = this.markerPosition;
  }

  onMapClick(event: any) {
    if (event.latLng) {
      this.markerPosition = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      };
      this.propertyForm.patchValue({
        lat: this.markerPosition.lat.toFixed(6),
        lng: this.markerPosition.lng.toFixed(6)
      });
      this.getAddressFromCoords(this.markerPosition.lat, this.markerPosition.lng);
    }
  }

  getAddressFromCoords(lat: number, lng: number) {
    if (typeof google === 'undefined' || !google.maps.Geocoder) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const addressComponents = results[0].address_components;
        let city = '';
        let country = '';

        for (const component of addressComponents) {
          if (component.types.includes('locality')) {
            city = component.long_name;
          }
          if (component.types.includes('country')) {
            country = component.long_name;
          }
        }

        this.propertyForm.patchValue({
          address: results[0].formatted_address,
          city: city || this.propertyForm.get('city')?.value,
          country: country || this.propertyForm.get('country')?.value
        });
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.isUploading = true;
      this.api.uploadImage(file).subscribe({
        next: (res) => {
          this.uploadedPhotos.push(res.url);
          this.isUploading = false;
        },
        error: (err) => {
          console.error('Upload failed', err);
          this.isUploading = false;
        }
      });
    }
  }

  removePhoto(index: number) {
    this.uploadedPhotos.splice(index, 1);
  }

  onSubmit(): void {
    if (this.propertyForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const val = this.propertyForm.getRawValue();

      const manualPhotos = val.photos ? val.photos.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '') : [];
      const allPhotos = [...new Set([...this.uploadedPhotos, ...manualPhotos])];

      const payload: any = {
        ...val,
        lat: val.lat ? Number(val.lat) : null,
        lng: val.lng ? Number(val.lng) : null,
        photos: allPhotos,
        videos: val.videos ? val.videos.split(',').map((s: string) => s.trim()) : [],
        tours360: val.tours360 ? val.tours360.split(',').map((s: string) => s.trim()) : [],
        documents: val.documents ? val.documents.split(',').map((s: string) => s.trim()) : [],
        features: val.features ? val.features.split(',').map((s: string) => s.trim()) : []
      };

      if (this.sellerSelection) {
        if (this.sellerSelection.createNew && this.sellerSelection.seller.name) {
          payload.newSeller = this.sellerSelection.seller;
        } else if (this.sellerSelection.sellerId) {
          payload.sellerId = this.sellerSelection.sellerId;
        }
      }

      this.dialogRef.close(payload);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSellerSelected(selection: SellerSelection): void {
    this.sellerSelection = selection;
  }
}
