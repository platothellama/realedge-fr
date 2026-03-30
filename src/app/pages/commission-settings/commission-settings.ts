import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../services/api';

interface DealCommission {
  id: string;
  dealId: string;
  userId: string;
  groupId?: string;
  roleInDeal: string;
  percentage: number;
  amount: number;
  status: string;
  user?: { id: string; name: string; email: string };
  deal?: { id: string; title: string; finalPrice?: number };
  group?: { id: string; name: string };
}

@Component({
  selector: 'app-commission-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatMenuModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSliderModule,
    MatTabsModule,
    MatProgressBarModule
  ],
  templateUrl: './commission-settings.html',
  styleUrl: './commission-settings.css'
})
export class CommissionSettingsComponent implements OnInit {
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  loading = true;
  saving = false;
  
  commissionSettings = {
    company: 40,
    team: 60
  };
  
  roleDefaults: any = {
    team_leader: 40,
    senior_agent: 30,
    agent: 20,
    trainee: 10
  };
  
  commissions: DealCommission[] = [];
  summary: any = {};
  
  statusFilter = '';
  processingId: string | null = null;

  settingsForm: FormGroup = this.fb.group({
    company: [40, [Validators.required, Validators.min(0), Validators.max(100)]],
    team: [60, [Validators.required, Validators.min(0), Validators.max(100)]]
  });

  roleForm: FormGroup = this.fb.group({
    team_leader: [40, [Validators.required, Validators.min(0), Validators.max(100)]],
    senior_agent: [30, [Validators.required, Validators.min(0), Validators.max(100)]],
    agent: [20, [Validators.required, Validators.min(0), Validators.max(100)]],
    trainee: [10, [Validators.required, Validators.min(0), Validators.max(100)]]
  });

  statusOptions = ['pending', 'approved', 'paid'];

  ngOnInit() {
    this.loadSettings();
    this.loadCommissions();
    this.loadSummary();
  }

  loadSettings() {
    this.api.getCommissionSettings().subscribe({
      next: (res: any) => {
        if (res.data) {
          this.commissionSettings = res.data;
          this.settingsForm.patchValue({
            company: res.data.companyPercentage || res.data.company || 40,
            team: res.data.teamPercentage || res.data.team || 60
          });
        }
      },
      error: (err) => {
        console.error('Failed to load settings', err);
      }
    });

    this.api.getCommissionSettingsAll().subscribe({
      next: (res: any) => {
        const settings = res.data || [];
        const roleSetting = settings.find((s: any) => s.sKey === 'default_role_splits');
        if (roleSetting?.value) {
          this.roleDefaults = roleSetting.value;
          this.roleForm.patchValue(roleSetting.value);
        }
      },
      error: (err) => {
        console.error('Failed to load role settings', err);
      }
    });
  }

  loadCommissions() {
    this.loading = true;
    const params: any = {};
    if (this.statusFilter) params.status = this.statusFilter;

    this.api.getCommissionsSummary(params).subscribe({
      next: (res: any) => {
        this.commissions = res.data?.commissions || [];
        this.summary = res.data?.summary || {};
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load commissions', err);
        this.commissions = [];
        this.loading = false;
      }
    });
  }

  loadSummary() {
    this.api.getCommissionsSummary().subscribe({
      next: (res: any) => {
        this.summary = res.data?.summary || {};
      },
      error: (err) => {
        console.error('Failed to load summary', err);
      }
    });
  }

  saveCommissionSplit() {
    if (this.settingsForm.invalid) return;
    
    const { company, team } = this.settingsForm.value;
    if (company + team !== 100) {
      this.snackBar.open('Company and team percentages must sum to 100%', 'Close', { duration: 3000 });
      return;
    }

    this.saving = true;
    this.api.updateCommissionSettings({ company, team }).subscribe({
      next: (res) => {
        this.commissionSettings = { company, team };
        this.saving = false;
        this.snackBar.open('Commission split saved', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open('Failed to save settings', 'Close', { duration: 3000 });
      }
    });
  }

  approveCommission(commission: DealCommission) {
    this.processingId = commission.id;
    this.api.approveDealCommission(commission.id).subscribe({
      next: () => {
        const index = this.commissions.findIndex(c => c.id === commission.id);
        if (index > -1) {
          this.commissions[index].status = 'approved';
        }
        this.loadSummary();
        this.processingId = null;
        this.snackBar.open('Commission approved', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.processingId = null;
        this.snackBar.open('Failed to approve commission', 'Close', { duration: 3000 });
      }
    });
  }

  markAsPaid(commission: DealCommission) {
    this.processingId = commission.id;
    this.api.markCommissionAsPaid(commission.id).subscribe({
      next: () => {
        const index = this.commissions.findIndex(c => c.id === commission.id);
        if (index > -1) {
          this.commissions[index].status = 'paid';
        }
        this.loadSummary();
        this.processingId = null;
        this.snackBar.open('Commission marked as paid', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.processingId = null;
        this.snackBar.open('Failed to update commission', 'Close', { duration: 3000 });
      }
    });
  }

  onSliderChange() {
    const company = this.settingsForm.get('company')?.value;
    this.settingsForm.patchValue({ team: 100 - company });
  }

  formatCurrency(value?: number): string {
    if (!value) return '$0';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  }

  formatPercent(value: number): string {
    return `${value}%`;
  }

  formatDate(date?: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'paid': return 'status-paid';
      case 'approved': return 'status-approved';
      case 'pending': return 'status-pending';
      default: return '';
    }
  }

  isProcessing(id: string): boolean {
    return this.processingId === id;
  }

  get totalPercentage(): number {
    return this.settingsForm.get('company')?.value || 0;
  }
}
