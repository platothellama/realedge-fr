import { Component, Inject, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GoogleMapsModule } from '@angular/google-maps';
import { GoogleMapsService } from '../../../services/google-maps.service';
import { ApiService } from '../../../services/api';
import { AuthService } from '../../../services/auth/auth.service';
import { SellerSelectorComponent, SellerSelection } from '../../molecules/seller-selector/seller-selector';
import { InfoCalloutComponent } from '../../molecules/info-callout/info-callout';

@Component({
  selector: 'app-property-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatTooltipModule,
    GoogleMapsModule,
    SellerSelectorComponent,
    InfoCalloutComponent
  ],
  templateUrl: './property-form.html',
  styleUrl: './property-form.css'
})
export class PropertyFormComponent implements OnInit, AfterViewInit {
  propertyForm: FormGroup;
  isEdit = false;
  statusLocked = false;
  currentUser: any = null;
  showAssignmentDropdown = false;

  propertyTypes = ['Apartment', 'House', 'Villa', 'Office', 'Land', 'Commercial'];
  statuses = ['Available', 'Sold', 'Rented', 'Reserved', 'Lost'];
  listingTypes = ['Sale', 'Rent'];
  conditions = ['Used', 'New'];
  users: any[] = [];
  groups: any[] = [];
  projects: any[] = [];
  loadingProjects = false;
  showNewProject = false;
  newProjectName = '';
  newProjectCity = '';
  availableFeatures: string[] = [];
  featureList: string[] = [];

  // Media Uploads
  uploadedPhotos: string[] = [];
  primaryPhotoIndex = 0;
  isUploading = false;
  uploadingCount = 0;
  totalUploading = 0;
  draggedIndex: number | null = null;

  // Video uploads (property walkthroughs, mp4/webm/mov)
  uploadedVideos: string[] = [];
  isUploadingVideo = false;
  uploadingVideoCount = 0;
  totalUploadingVideo = 0;
  videoUploadError = '';

  // Document uploads (floor plans, brochures, deeds — pdf/doc/xls/...)
  uploadedDocuments: string[] = [];
  isUploadingDoc = false;
  uploadingDocCount = 0;
  totalUploadingDoc = 0;
  docUploadError = '';

  // Map options
  mapCenter: any = { lat: 25.2048, lng: 55.2708 };
  mapZoom = 12;
  markerPosition: any = null;
  // QA 2026-09-18 (real browser test): without a Maps API key the
  // <google-map> component throws and the global error dialog blocks the
  // whole wizard. Hide the map and keep manual address entry working.
  mapsAvailable = false;
  mapOptions: any = {
    mapTypeId: 'roadmap',
    zoomControl: true,
    scrollwheel: false,
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

  currentStep = 0;
  totalSteps = 5;
  wizardSteps = [
    { label: 'Basic Info', icon: 'info', valid: false },
    { label: 'Details', icon: 'format_list_bulleted', valid: false },
    { label: 'Location', icon: 'location_on', valid: false },
    { label: 'Media', icon: 'perm_media', valid: false },
    { label: 'Review', icon: 'check_circle', valid: false }
  ];
  stepErrors: { [key: number]: string } = {};

  get isLastStep(): boolean {
    return this.currentStep === this.totalSteps - 1;
  }

  get isFirstStep(): boolean {
    return this.currentStep === 0;
  }

  private validateStep(step: number): boolean {
    this.stepErrors[step] = '';
    const form = this.propertyForm;

    switch (step) {
      case 0: // Basic Info
        const title = form.get('title')?.value;
        const price = form.get('price')?.value;
        const type = form.get('type')?.value;
        if (!title || title.trim() === '') {
          this.stepErrors[step] = 'Property title is required';
          return false;
        }
        if (price === null || price === undefined || price < 0) {
          this.stepErrors[step] = 'Valid price is required';
          return false;
        }
        if (!type) {
          this.stepErrors[step] = 'Property type is required';
          return false;
        }
        return true;

      case 1: { // Details - numerics must be in range (previously always
        // true, so e.g. -5 bedrooms advanced silently and Publish stayed
        // disabled on Review with no visible error).
        const numericLabels: Record<string, string> = {
          bedrooms: 'Bedrooms',
          masterBedrooms: 'Master bedrooms',
          bathrooms: 'Bathrooms',
          balconies: 'Balconies',
          area: 'Area',
          lotSize: 'Lot size',
          yearBuilt: 'Year built',
          parkingSpaces: 'Parking spaces',
          terraceSize: 'Terrace size',
          cellarSize: 'Cellar size'
        };
        for (const f of Object.keys(numericLabels)) {
          const c = form.get(f);
          if (c && c.invalid) {
            c.markAsTouched();
            if (c.hasError('min')) {
              this.stepErrors[step] = `${numericLabels[f]} cannot be negative`;
            } else if (c.hasError('max')) {
              this.stepErrors[step] = `${numericLabels[f]} is unrealistically large`;
            } else {
              this.stepErrors[step] = `${numericLabels[f]} is invalid`;
            }
            return false;
          }
        }
        // Master bedrooms are a subset of total bedrooms.
        const totalBeds = Number(form.get('bedrooms')?.value ?? 0);
        const masterBeds = Number(form.get('masterBedrooms')?.value ?? 0);
        if (Number.isFinite(masterBeds) && Number.isFinite(totalBeds) && masterBeds > totalBeds) {
          form.get('masterBedrooms')?.markAsTouched();
          this.stepErrors[step] = 'Master bedrooms cannot exceed total bedrooms';
          return false;
        }
        return true;
      }

      case 2: // Location
        const address = form.get('address')?.value;
        const city = form.get('city')?.value;
        const country = form.get('country')?.value;
        if (!address || address.trim() === '') {
          this.stepErrors[step] = 'Street address is required';
          return false;
        }
        if (!city || city.trim() === '') {
          this.stepErrors[step] = 'City is required';
          return false;
        }
        if (!country || country.trim() === '') {
          this.stepErrors[step] = 'Country is required';
          return false;
        }
        return true;

      case 3: // Media - no required fields, always valid
        return true;

      case 4: // Review
        return true;

      default:
        return true;
    }
  }

  nextStep(): void {
    if (this.validateStep(this.currentStep)) {
      if (this.currentStep < this.totalSteps - 1) {
        this.currentStep++;
      }
    }
  }

  prevStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    if (step >= 0 && step < this.totalSteps) {
      if (step > this.currentStep) {
        if (this.validateStep(this.currentStep)) {
          this.currentStep = step;
        }
      } else {
        this.currentStep = step;
      }
    }
  }

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PropertyFormComponent>,
    private api: ApiService,
    private auth: AuthService,
    private maps: GoogleMapsService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    const user = this.auth.currentUser();
    this.currentUser = user;
    const userRole = user?.role || '';
    this.isAdmin = userRole === 'Super Admin';

    // Hide assignment dropdown - show only for Super Admin
    this.showAssignmentDropdown = this.isAdmin;

    // Default assignment to current user (already set - for Agent it auto-assigns to self)
    const defaultAssignedToUserId = user?.id || null;
    this.propertyForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      status: ['Available', Validators.required],
      type: ['Apartment', Validators.required],
      listingType: ['Sale', Validators.required],
      condition: ['Used', Validators.required],

      // Details (QA 2026-09-18: range guards; floor intentionally unclamped — basements are negative)
      bedrooms: [0, Validators.min(0)],
      masterBedrooms: [0, Validators.min(0)],
      bathrooms: [0, Validators.min(0)],
      balconies: [0, Validators.min(0)],
      area: [0, Validators.min(0)],
      lotSize: [0, Validators.min(0)],
      yearBuilt: [new Date().getFullYear(), Validators.max(new Date().getFullYear() + 1)],
      parkingSpaces: [0, Validators.min(0)],
      floor: [null],
      hasTerrace: [false],
      terraceSize: [0, Validators.min(0)],
      hasCellar: [false],
      cellarSize: [0, Validators.min(0)],

      // Location
      address: ['', Validators.required],
      city: ['', Validators.required],
      country: ['', Validators.required],
      lat: [null, [Validators.min(-90), Validators.max(90)]],
      lng: [null, [Validators.min(-180), Validators.max(180)]],

      // Assignments
      assignedToUserId: [defaultAssignedToUserId],
      assignedToGroupId: [null],
      sellerId: [null],
      // Optional project/building grouping (NULL = standalone listing)
      projectId: [null],
      photos: [''],
      videos: [''],
      tours360: [''],
      documents: [''],

      // Sold/Lost Info
      soldTo: [''],
      soldAt: [null],
      lostTo: [''],
      lostAt: [null],

      // Features
      features: ['']
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.loadUsers();
    this.loadGroups();
    this.loadProjects();
    this.loadFeatures();
    this.handleEditMode();
    this.subscribeToLocationChanges();
    // Map preview only when the Maps API actually loaded; otherwise the
    // <google-map> component throws and blocks the wizard (QA 2026-09-18).
    this.mapsAvailable = this.maps.isLoaded();
    if (!this.mapsAvailable && this.maps.isConfigured()) {
      this.maps.load().then(() => { this.mapsAvailable = this.maps.isLoaded(); }).catch(() => { this.mapsAvailable = false; });
    }
  }

  private loadFeatures() {
    this.api.getUniqueFeatures().subscribe({
      next: (res) => {
        this.availableFeatures = res || [];
      },
      error: (err) => {
        console.error('Error fetching features', err);
        this.availableFeatures = [];
      }
    });
  }

  filterFeatures(value: string): string[] {
    if (!value) return this.availableFeatures;
    const filterValue = value.toLowerCase();
    return this.availableFeatures.filter(f => f.toLowerCase().includes(filterValue));
  }

  displayFeature(feature: string): string {
    return feature || '';
  }

  addFeature(event: any): void {
    let value = '';
    if (event.target && event.target.value) {
      value = (event.target.value || '').trim();
    } else if (event.option && event.option.value) {
      value = (event.option.value || '').trim();
    }
    if (value && !this.featureList.includes(value)) {
      this.featureList.push(value);
      this.updateFeatureControl();
    }
    const input = document.querySelector('.feature-input') as HTMLInputElement;
    if (input) input.value = '';
  }

  removeFeature(feature: string): void {
    const index = this.featureList.indexOf(feature);
    if (index >= 0) {
      this.featureList.splice(index, 1);
      this.updateFeatureControl();
    }
  }

  private updateFeatureControl() {
    this.propertyForm.get('features')?.setValue(this.featureList.join(', '));
  }

  private initForm() {
    const user = this.auth.currentUser();
    const defaultAssignedToUserId = user?.id || null;
    this.propertyForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      status: ['Available', Validators.required],
      type: ['Apartment', Validators.required],
      listingType: ['Sale', Validators.required],
      condition: ['Used', Validators.required],
      bedrooms: [0, Validators.min(0)],
      masterBedrooms: [0, Validators.min(0)],
      bathrooms: [0, Validators.min(0)],
      balconies: [0, Validators.min(0)],
      area: [0, Validators.min(0)],
      lotSize: [0, Validators.min(0)],
      yearBuilt: [new Date().getFullYear(), Validators.max(new Date().getFullYear() + 1)],
      parkingSpaces: [0, Validators.min(0)],
      floor: [null],
      hasTerrace: [false],
      terraceSize: [0, Validators.min(0)],
      hasCellar: [false],
      cellarSize: [0, Validators.min(0)],
      address: ['', Validators.required],
      city: ['', Validators.required],
      country: ['', Validators.required],
      lat: [null, [Validators.min(-90), Validators.max(90)]],
      lng: [null, [Validators.min(-180), Validators.max(180)]],
      assignedToUserId: [defaultAssignedToUserId],
      assignedToGroupId: [null],
      sellerId: [null],
      // Optional project/building grouping (NULL = standalone listing)
      projectId: [null],
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

  private loadProjects() {
    this.loadingProjects = true;
    this.api.getProjects().subscribe({
      next: (res: any) => {
        this.projects = Array.isArray(res) ? res : (res?.data || []);
        this.loadingProjects = false;
      },
      error: (err) => {
        console.error('Error fetching projects', err);
        this.projects = [];
        this.loadingProjects = false;
      }
    });
  }

  toggleNewProject(): void {
    this.showNewProject = !this.showNewProject;
    if (this.showNewProject) {
      this.propertyForm.get('projectId')?.setValue(null);
    } else {
      this.newProjectName = '';
      this.newProjectCity = '';
    }
  }

  get selectedProject(): any {
    const id = this.propertyForm.get('projectId')?.value;
    if (!id) return null;
    return this.projects.find((p: any) => p.id === id) || null;
  }

  private handleEditMode() {
    if (this.data && this.data.property) {
      this.isEdit = true;
      const prop = this.data.property;

      this.statusLocked = prop.status === 'Sold';

      if (this.statusLocked) {
        this.propertyForm.disable();
      }

      this.uploadedPhotos = prop.photos || [];
      this.primaryPhotoIndex = prop.primaryPhotoIndex || 0;
      this.uploadedVideos = Array.isArray(prop.videos) ? [...prop.videos] : [];
      this.uploadedDocuments = Array.isArray(prop.documents) ? [...prop.documents] : [];
      this.featureList = prop.features || [];

      this.propertyForm.patchValue({
        ...prop,
        projectId: prop.projectId || prop.project?.id || null,
        photos: prop.photos?.join(', ') || '',
        videos: '',
        tours360: prop.tours360?.join(', ') || '',
        documents: '',
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
      this.uploadFiles([file]);
    }
  }

  onFilesSelected(event: any) {
    const files: File[] = Array.from(event.target.files as FileList);
    if (files.length > 0) {
      this.uploadFiles(files);
    }
    event.target.value = '';
  }

  onVideoFilesSelected(event: any) {
    const files: File[] = Array.from(event.target.files as FileList);
    if (files.length > 0) {
      this.uploadVideoFiles(files);
    }
    event.target.value = '';
  }

  onDocumentFilesSelected(event: any) {
    const files: File[] = Array.from(event.target.files as FileList);
    if (files.length > 0) {
      this.uploadDocumentFiles(files);
    }
    event.target.value = '';
  }

  uploadVideoFiles(files: File[]) {
    this.isUploadingVideo = true;
    this.videoUploadError = '';
    this.totalUploadingVideo = files.length;
    this.uploadingVideoCount = 0;

    let completed = 0;
    files.forEach((file) => {
      this.api.uploadVideo(file).subscribe({
        next: (res) => {
          if (res?.url) this.uploadedVideos.push(res.url);
          completed++;
          this.uploadingVideoCount = completed;
          if (completed === files.length) {
            this.isUploadingVideo = false;
          }
        },
        error: (err) => {
          console.error('Video upload failed', err);
          this.videoUploadError = err?.error?.message || 'Video upload failed. Use mp4/webm/mov (max 100MB).';
          completed++;
          this.uploadingVideoCount = completed;
          if (completed === files.length) {
            this.isUploadingVideo = false;
          }
        }
      });
    });
  }

  uploadDocumentFiles(files: File[]) {
    this.isUploadingDoc = true;
    this.docUploadError = '';
    this.totalUploadingDoc = files.length;
    this.uploadingDocCount = 0;

    let completed = 0;
    files.forEach((file) => {
      this.api.uploadPropertyDocument(file).subscribe({
        next: (res) => {
          if (res?.url) this.uploadedDocuments.push(res.url);
          completed++;
          this.uploadingDocCount = completed;
          if (completed === files.length) {
            this.isUploadingDoc = false;
          }
        },
        error: (err) => {
          console.error('Document upload failed', err);
          this.docUploadError = err?.error?.message || 'Document upload failed. Use pdf/doc/xls/ppt/txt/csv (max 10MB).';
          completed++;
          this.uploadingDocCount = completed;
          if (completed === files.length) {
            this.isUploadingDoc = false;
          }
        }
      });
    });
  }

  removeVideo(index: number) {
    this.uploadedVideos.splice(index, 1);
  }

  removeDocument(index: number) {
    this.uploadedDocuments.splice(index, 1);
  }

  fileNameFromUrl(url: string): string {
    try {
      const clean = url.split('?')[0];
      const parts = clean.split('/');
      return decodeURIComponent(parts[parts.length - 1] || url);
    } catch {
      return url;
    }
  }

  get hasPendingMediaUpload(): boolean {
    return this.isUploading || this.isUploadingVideo || this.isUploadingDoc;
  }

  uploadFiles(files: File[]) {
    this.isUploading = true;
    this.totalUploading = files.length;
    this.uploadingCount = 0;

    let completed = 0;
    files.forEach((file) => {
      this.api.uploadImage(file).subscribe({
        next: (res) => {
          this.uploadedPhotos.push(res.url);
          completed++;
          this.uploadingCount = completed;
          if (completed === files.length) {
            this.isUploading = false;
          }
        },
        error: (err) => {
          console.error('Upload failed', err);
          completed++;
          this.uploadingCount = completed;
          if (completed === files.length) {
            this.isUploading = false;
          }
        }
      });
    });
  }

  removePhoto(index: number) {
    this.uploadedPhotos.splice(index, 1);
    if (this.primaryPhotoIndex >= this.uploadedPhotos.length) {
      this.primaryPhotoIndex = Math.max(0, this.uploadedPhotos.length - 1);
    } else if (index < this.primaryPhotoIndex) {
      this.primaryPhotoIndex--;
    }
  }

  onPhotoDragStart(index: number) {
    this.draggedIndex = index;
  }

  onPhotoDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    event.stopPropagation();
  }

  onPhotoDrop(event: DragEvent, dropIndex: number) {
    event.preventDefault();
    event.stopPropagation();
    
    if (this.draggedIndex !== null && this.draggedIndex !== dropIndex) {
      const photo = this.uploadedPhotos.splice(this.draggedIndex, 1)[0];
      this.uploadedPhotos.splice(dropIndex, 0, photo);
      
      if (this.primaryPhotoIndex === this.draggedIndex) {
        this.primaryPhotoIndex = dropIndex;
      } else if (this.draggedIndex < this.primaryPhotoIndex && dropIndex >= this.primaryPhotoIndex) {
        this.primaryPhotoIndex--;
      } else if (this.draggedIndex > this.primaryPhotoIndex && dropIndex <= this.primaryPhotoIndex) {
        this.primaryPhotoIndex++;
      }
    }
    this.draggedIndex = null;
  }

  onPhotoDragEnd() {
    this.draggedIndex = null;
  }

  setPrimaryPhoto(index: number) {
    this.primaryPhotoIndex = index;
  }

  onSubmit(): void {
    // QA 2026-09-18: submitting mid-upload silently dropped in-flight photos.
    if (this.hasPendingMediaUpload) return;
    if (this.propertyForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const val = this.propertyForm.getRawValue();
      const manualPhotos = val.photos ? val.photos.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '') : [];
      const allPhotos = [...new Set([...this.uploadedPhotos, ...manualPhotos])];
      const manualVideos = val.videos ? val.videos.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '') : [];
      const allVideos = [...new Set([...this.uploadedVideos, ...manualVideos])];
      const manualDocs = val.documents ? val.documents.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '') : [];
      const allDocs = [...new Set([...this.uploadedDocuments, ...manualDocs])];

      const payload: any = {
        ...val,
        bedrooms: val.bedrooms === null || val.bedrooms === undefined || val.bedrooms === '' ? 0 : Number(val.bedrooms),
        masterBedrooms: val.masterBedrooms === null || val.masterBedrooms === undefined || val.masterBedrooms === '' ? 0 : Number(val.masterBedrooms),
        bathrooms: val.bathrooms === null || val.bathrooms === undefined || val.bathrooms === '' ? 0 : Number(val.bathrooms),
        balconies: val.balconies === null || val.balconies === undefined || val.balconies === '' ? 0 : Number(val.balconies),
        lat: val.lat ? Number(val.lat) : null,
        lng: val.lng ? Number(val.lng) : null,
        projectId: val.projectId || null,
        photos: allPhotos,
        primaryPhotoIndex: this.primaryPhotoIndex,
        videos: allVideos,
        tours360: val.tours360 ? val.tours360.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '') : [],
        documents: allDocs,
        features: this.featureList
      };

      // Optional on-the-fly project creation (same pattern as newSeller).
      if (this.showNewProject && this.newProjectName.trim()) {
        payload.newProject = {
          name: this.newProjectName.trim(),
          city: this.newProjectCity.trim() || val.city || null
        };
        payload.projectId = undefined;
      }

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

  getCalculatedCommission(): number {
    const price = this.propertyForm.get('price')?.value || 0;
    const percentage = this.propertyForm.get('commissionPercentage')?.value || 0;
    return (Number(price) * Number(percentage)) / 100;
  }
}
