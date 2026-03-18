import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRadioModule } from '@angular/material/radio';
import { ApiService } from '../../services/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-buyer-preferences',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatChipsModule,
    MatTabsModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatRadioModule
  ],
  templateUrl: './buyer-preferences.html',
  styleUrl: './buyer-preferences.css',
})
export class BuyerPreferencesComponent implements OnInit {
  preferences: any[] = [];
  leads: any[] = [];
  loading = false;
  showForm = false;
  editingPreference: any = null;

  formData = {
    leadId: null as string | null,
    createNewLead: false,
    newLeadData: {
      name: '',
      email: '',
      phone: '',
      budget: null as number | null,
      propertyPreferences: '',
      preferredAreas: ''
    },
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    budgetMin: null as number | null,
    budgetMax: null as number | null,
    propertyType: '',
    bedrooms: null as number | null,
    bathrooms: null as number | null,
    minArea: null as number | null,
    maxArea: null as number | null,
    preferredLocations: '' as string,
    purchaseType: 'buy',
    parkingRequired: false,
    balconyRequired: false,
    furnishedRequired: false,
    floorPreference: '',
    viewType: '',
    distanceToSchool: null as number | null,
    distanceToTransport: null as number | null,
    additionalFeatures: '' as string,
    description: ''
  };

  propertyTypes = ['Apartment', 'House', 'Villa', 'Office', 'Land', 'Commercial'];
  purchaseTypes = [
    { value: 'buy', label: 'Buy' },
    { value: 'rent', label: 'Rent' }
  ];
  floorOptions = ['Ground', '1-3', '4-10', '11-20', '20+', 'Penthouse'];
  viewOptions = ['City', 'Sea', 'Mountain', 'Garden', 'Pool', 'Street'];

  displayedColumns = ['clientName', 'propertyType', 'budget', 'status', 'matchCount', 'actions'];

  constructor(
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit() {
    this.fetchPreferences();
    this.fetchLeads();
  }

  fetchLeads() {
    this.apiService.getLeadsForMatcher().subscribe({
      next: (data) => {
        this.leads = data;
      },
      error: (err) => {
        console.error('Failed to fetch leads', err);
      }
    });
  }

  fetchPreferences() {
    this.loading = true;
    this.apiService.getBuyerPreferences().subscribe({
      next: (data) => {
        this.preferences = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to fetch buyer preferences', err);
        this.showError('Failed to load buyer preferences');
        this.loading = false;
      }
    });
  }

  openForm(preference?: any) {
    if (preference) {
      this.editingPreference = preference;
      this.formData = {
        leadId: preference.clientId || null,
        createNewLead: false,
        newLeadData: {
          name: preference.clientName || '',
          email: preference.clientEmail || '',
          phone: preference.clientPhone || '',
          budget: preference.budgetMin || null,
          propertyPreferences: preference.propertyType || '',
          preferredAreas: Array.isArray(preference.preferredLocations) ? preference.preferredLocations.join(', ') : ''
        },
        clientName: preference.clientName || '',
        clientEmail: preference.clientEmail || '',
        clientPhone: preference.clientPhone || '',
        budgetMin: preference.budgetMin || null,
        budgetMax: preference.budgetMax || null,
        propertyType: preference.propertyType || '',
        bedrooms: preference.bedrooms || null,
        bathrooms: preference.bathrooms || null,
        minArea: preference.minArea || null,
        maxArea: preference.maxArea || null,
        preferredLocations: Array.isArray(preference.preferredLocations) ? preference.preferredLocations.join(', ') : '',
        purchaseType: preference.purchaseType || 'buy',
        parkingRequired: preference.parkingRequired || false,
        balconyRequired: preference.balconyRequired || false,
        furnishedRequired: preference.furnishedRequired || false,
        floorPreference: preference.floorPreference || '',
        viewType: preference.viewType || '',
        distanceToSchool: preference.distanceToSchool || null,
        distanceToTransport: preference.distanceToTransport || null,
        additionalFeatures: Array.isArray(preference.additionalFeatures) ? preference.additionalFeatures.join(', ') : '',
        description: preference.description || ''
      };
    } else {
      this.resetForm();
    }
    this.showForm = true;
  }

  onLeadSelect(leadId: string | null) {
    if (leadId) {
      const lead = this.leads.find(l => l.id === leadId);
      if (lead) {
        this.formData.clientName = lead.name || '';
        this.formData.clientEmail = lead.email || '';
        this.formData.clientPhone = lead.phone || '';
        if (lead.budget && !this.formData.budgetMin) {
          this.formData.budgetMax = lead.budget;
        }
        if (lead.propertyPreferences && !this.formData.propertyType) {
          this.formData.propertyType = lead.propertyPreferences;
        }
        if (lead.preferredAreas && !this.formData.preferredLocations) {
          this.formData.preferredLocations = lead.preferredAreas;
        }
      }
    }
  }

  toggleNewLead(isNew: boolean) {
    this.formData.createNewLead = isNew;
    if (isNew) {
      this.formData.leadId = null;
    }
  }

  closeForm() {
    this.showForm = false;
    this.editingPreference = null;
    this.resetForm();
  }

  resetForm() {
    this.formData = {
      leadId: null,
      createNewLead: false,
      newLeadData: {
        name: '',
        email: '',
        phone: '',
        budget: null,
        propertyPreferences: '',
        preferredAreas: ''
      },
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      budgetMin: null,
      budgetMax: null,
      propertyType: '',
      bedrooms: null,
      bathrooms: null,
      minArea: null,
      maxArea: null,
      preferredLocations: '',
      purchaseType: 'buy',
      parkingRequired: false,
      balconyRequired: false,
      furnishedRequired: false,
      floorPreference: '',
      viewType: '',
      distanceToSchool: null,
      distanceToTransport: null,
      additionalFeatures: '',
      description: ''
    };
  }

  savePreference() {
    const data: any = {
      leadId: this.formData.leadId,
      createNewLead: this.formData.createNewLead,
      newLeadData: this.formData.createNewLead ? this.formData.newLeadData : null,
      clientName: this.formData.clientName,
      clientEmail: this.formData.clientEmail,
      clientPhone: this.formData.clientPhone,
      budgetMin: this.formData.budgetMin,
      budgetMax: this.formData.budgetMax,
      propertyType: this.formData.propertyType,
      bedrooms: this.formData.bedrooms,
      bathrooms: this.formData.bathrooms,
      minArea: this.formData.minArea,
      maxArea: this.formData.maxArea,
      preferredLocations: this.formData.preferredLocations.split(',').map((l: string) => l.trim()).filter((l: string) => l),
      purchaseType: this.formData.purchaseType,
      parkingRequired: this.formData.parkingRequired,
      balconyRequired: this.formData.balconyRequired,
      furnishedRequired: this.formData.furnishedRequired,
      floorPreference: this.formData.floorPreference,
      viewType: this.formData.viewType,
      distanceToSchool: this.formData.distanceToSchool,
      distanceToTransport: this.formData.distanceToTransport,
      additionalFeatures: this.formData.additionalFeatures.split(',').map((f: string) => f.trim()).filter((f: string) => f),
      description: this.formData.description
    };

    if (this.editingPreference) {
      this.apiService.updateBuyerPreference(this.editingPreference.id, data).subscribe({
        next: () => {
          this.showSuccess('Buyer preference updated');
          this.fetchPreferences();
          this.closeForm();
        },
        error: (err) => {
          this.showError('Failed to update preference');
        }
      });
    } else {
      this.apiService.createBuyerPreference(data).subscribe({
        next: () => {
          this.showSuccess('Buyer preference created');
          this.fetchPreferences();
          this.closeForm();
        },
        error: (err) => {
          this.showError('Failed to create preference');
        }
      });
    }
  }

  deletePreference(id: string) {
    if (confirm('Are you sure you want to delete this buyer preference?')) {
      this.apiService.deleteBuyerPreference(id).subscribe({
        next: () => {
          this.showSuccess('Preference deleted');
          this.fetchPreferences();
        },
        error: () => {
          this.showError('Failed to delete preference');
        }
      });
    }
  }

  matchProperties(preferenceId: string) {
    this.router.navigate(['/property-matcher', preferenceId]);
  }

  getBudgetRange(preference: any): string {
    if (preference.budgetMin && preference.budgetMax) {
      return `$${preference.budgetMin.toLocaleString()} - $${preference.budgetMax.toLocaleString()}`;
    } else if (preference.budgetMax) {
      return `Up to $${preference.budgetMax.toLocaleString()}`;
    } else if (preference.budgetMin) {
      return `From $${preference.budgetMin.toLocaleString()}`;
    }
    return 'Not specified';
  }

  getLocationString(preference: any): string {
    if (Array.isArray(preference.preferredLocations) && preference.preferredLocations.length > 0) {
      return preference.preferredLocations.join(', ');
    }
    return 'Any';
  }

  private showSuccess(message: string) {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }

  private showError(message: string) {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
}
