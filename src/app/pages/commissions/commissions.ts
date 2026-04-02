import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { RouterModule } from '@angular/router';

interface DealCommission {
  id: string;
  dealId: string;
  userId: string;
  groupId?: string;
  roleInDeal: string;
  percentage: number;
  amount: number;
  status: string;
  createdAt?: string;
  approvedAt?: string;
  paidAt?: string;
  user?: { id: string; name: string; email: string; photo?: string };
  deal?: { id: string; title: string; finalPrice?: number; closedAt?: string; property?: { id: string; title: string; address?: string } };
  group?: { id: string; name: string };
}

@Component({
  selector: 'app-commissions',
  standalone: true,
  imports: [
    CommonModule,
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
    MatDialogModule,
    MatTooltipModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './commissions.html',
  styleUrl: './commissions.css'
})
export class CommissionsComponent implements OnInit {
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);

  loading = true;
  commissions: DealCommission[] = [];
  summary: any = {};
  processingId: string | null = null;
  
  statusFilter = '';
  roleFilter = '';
  
  displayedColumns = ['deal', 'agent', 'role', 'salePrice', 'percentage', 'amount', 'status', 'createdAt', 'actions'];

  statusOptions = ['pending', 'approved', 'paid'];
  roleOptions = ['seller_agent', 'buyer_agent', 'co_agent', 'team_leader'];

  ngOnInit() {
    this.loadCommissions();
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
        console.error('Failed to fetch commissions', err);
        this.commissions = [];
        this.loading = false;
        this.snackBar.open('Failed to load commissions', 'Close', { duration: 3000 });
      }
    });
  }

  approveCommission(commission: DealCommission) {
    this.processingId = commission.id;
    this.api.approveDealCommission(commission.id).subscribe({
      next: (res: any) => {
        const index = this.commissions.findIndex(c => c.id === commission.id);
        if (index > -1) {
          this.commissions[index].status = 'approved';
          this.commissions[index].approvedAt = new Date().toISOString();
        }
        this.snackBar.open('Commission approved', 'Close', { duration: 2000 });
        this.processingId = null;
      },
      error: (err) => {
        this.snackBar.open('Failed to approve commission', 'Close', { duration: 3000 });
        this.processingId = null;
      }
    });
  }

  markAsPaid(commission: DealCommission) {
    this.processingId = commission.id;
    this.api.markCommissionAsPaid(commission.id).subscribe({
      next: (res: any) => {
        const index = this.commissions.findIndex(c => c.id === commission.id);
        if (index > -1) {
          this.commissions[index].status = 'paid';
          this.commissions[index].paidAt = new Date().toISOString();
        }
        this.snackBar.open('Commission marked as paid', 'Close', { duration: 2000 });
        this.processingId = null;
      },
      error: (err) => {
        this.snackBar.open('Failed to mark as paid', 'Close', { duration: 3000 });
        this.processingId = null;
      }
    });
  }

  isProcessing(id: string): boolean {
    return this.processingId === id;
  }

  formatCurrency(value: number): string {
    if (!value) return '$0';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  formatDateTime(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'paid': return 'status-paid';
      case 'approved': return 'status-approved';
      case 'pending': return 'status-pending';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    return status ? status.replace('_', ' ') : '';
  }

  getRoleLabel(role: string): string {
    const labels: any = {
      'seller_agent': 'Seller Agent',
      'buyer_agent': 'Buyer Agent',
      'co_agent': 'Co-Agent',
      'team_leader': 'Team Leader'
    };
    return labels[role] || role;
  }

  getPropertyTitle(commission: DealCommission): string {
    return commission.deal?.property?.title || commission.deal?.title || 'N/A';
  }

  getAgentName(commission: DealCommission): string {
    return commission.user?.name || 'Unknown Agent';
  }

  getSalePrice(commission: DealCommission): number {
    return commission.deal?.finalPrice || 0;
  }

  clearFilters() {
    this.statusFilter = '';
    this.roleFilter = '';
    this.loadCommissions();
  }
}