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
  saving = false;
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
    purchaseType: 'buy'
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
      next: (data: any) => {
        this.leads = Array.isArray(data) ? data : (data?.data || []);
      },
      error: (err) => {
        console.error('Failed to fetch leads', err);
        this.leads = [];
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
          budget: null,
          propertyPreferences: '',
          preferredAreas: ''
        },
        clientName: preference.clientName || '',
        clientEmail: preference.clientEmail || '',
        clientPhone: preference.clientPhone || '',
        purchaseType: preference.purchaseType || 'buy'
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
      purchaseType: 'buy'
    };
  }

  savePreference() {
    if (!this.formData.clientName?.trim()) {
      this.showError('Client name is required');
      return;
    }
    
    this.saving = true;
    const data: any = {
      leadId: this.formData.leadId,
      createNewLead: this.formData.createNewLead,
      newLeadData: this.formData.createNewLead ? this.formData.newLeadData : null,
      clientName: this.formData.clientName,
      clientEmail: this.formData.clientEmail,
      clientPhone: this.formData.clientPhone,
      purchaseType: this.formData.purchaseType
    };

    if (this.editingPreference) {
      this.apiService.updateBuyerPreference(this.editingPreference.id, data).subscribe({
        next: () => {
          this.showSuccess('Buyer preference updated');
          this.fetchPreferences();
          this.closeForm();
          this.saving = false;
        },
        error: (err) => {
          this.showError('Failed to update preference');
          this.saving = false;
        }
      });
    } else {
      this.apiService.createBuyerPreference(data).subscribe({
        next: () => {
          this.showSuccess('Buyer preference created');
          this.fetchPreferences();
          this.closeForm();
          this.saving = false;
        },
        error: (err) => {
          this.showError('Failed to create preference');
          this.saving = false;
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
