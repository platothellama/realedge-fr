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
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

interface Commission {
  id: string;
  dealId: string;
  agentId: string;
  propertyId: string;
  salePrice: number;
  commissionPercentage: number;
  grossCommission: number;
  agentSharePercentage: number;
  agentCommission: number;
  officeCommission: number;
  status: string;
  paidAmount: number;
  paidAt?: string;
  notes?: string;
  splitType?: string;
  agent2Id?: string;
  agent2SharePercentage?: number;
  agent2Commission?: number;
  teamId?: string;
  teamSharePercentage?: number;
  teamCommission?: number;
  companySharePercentage?: number;
  companyCommission?: number;
  deal?: { id: string; title: string };
  property?: { id: string; title: string };
  agent?: { id: string; name: string; photo?: string };
  agent2?: { id: string; name: string; photo?: string };
  team?: { id: string; name: string };
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
    FormsModule
  ],
  templateUrl: './commissions.html',
  styleUrl: './commissions.css'
})
export class CommissionsComponent implements OnInit {
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);

  loading = true;
  commissions: Commission[] = [];
  stats: any = {};
  processingId: string | null = null;
  
  statusFilter = '';
  showAddDialog = false;
  
  newCommission: Partial<Commission> = {
    salePrice: 0,
    commissionPercentage: 2.5,
    agentSharePercentage: 60
  };

  statusOptions = ['pending', 'approved', 'paid', 'disbursed'];
  splitTypeOptions = ['single', 'multi_agent', 'team'];
  agents: any[] = [];
  teams: any[] = [];

  ngOnInit() {
    this.loadCommissions();
    this.loadStats();
    this.loadAgents();
    this.loadTeams();
  }

  loadAgents() {
    this.api.getUsers().subscribe({
      next: (res: any) => {
        this.agents = Array.isArray(res) ? res : res.data || [];
      },
      error: (err) => console.error('Failed to fetch agents', err)
    });
  }

  loadTeams() {
    this.api.getTeams().subscribe({
      next: (res: any) => {
        this.teams = Array.isArray(res) ? res : res.data || [];
      },
      error: (err) => console.error('Failed to fetch teams', err)
    });
  }

  loadCommissions() {
    this.loading = true;
    const filters: any = {};
    if (this.statusFilter) filters.status = this.statusFilter;

    this.api.getCommissions(filters).subscribe({
      next: (res: any) => {
        this.commissions = Array.isArray(res) ? res : res.data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to fetch commissions', err);
        this.commissions = [];
        this.loading = false;
      }
    });
  }

  loadStats() {
    this.api.getCommissionStats().subscribe({
      next: (res) => {
        this.stats = res || {};
      },
      error: (err) => {
        console.error('Failed to fetch stats', err);
      }
    });
  }

  calculateAndCreate() {
    if (!this.newCommission.salePrice || !this.newCommission.agentId) {
      this.snackBar.open('Sale price and agent are required', 'Close', { duration: 3000 });
      return;
    }

    const salePrice = this.newCommission.salePrice;
    const commissionPercentage = this.newCommission.commissionPercentage || 2.5;
    const agentSharePercentage = this.newCommission.agentSharePercentage || 60;
    const splitType = this.newCommission.splitType || 'single';
    
    const grossCommission = salePrice * (commissionPercentage / 100);
    let agentCommission = 0;
    let officeCommission = 0;
    let agent2Commission = 0;
    let teamCommission = 0;
    let companyCommission = 0;

    if (splitType === 'multi_agent' && this.newCommission.agent2Id) {
      const agent2SharePercentage = this.newCommission.agent2SharePercentage || 50;
      const totalAgentShare = agentSharePercentage + agent2SharePercentage;
      const companyShare = 100 - totalAgentShare;
      
      agentCommission = grossCommission * (agentSharePercentage / 100);
      agent2Commission = grossCommission * (agent2SharePercentage / 100);
      companyCommission = grossCommission * (companyShare / 100);
      officeCommission = companyCommission;
    } else if (splitType === 'team' && this.newCommission.teamId) {
      const team = this.teams.find(t => t.id === this.newCommission.teamId);
      const teamSharePercentage = team?.commissionSplit || 50;
      const agentPortion = grossCommission * (agentSharePercentage / 100);
      const teamPortion = grossCommission * (teamSharePercentage / 100);
      
      agentCommission = agentPortion;
      teamCommission = teamPortion;
      companyCommission = grossCommission - agentPortion - teamPortion;
      officeCommission = companyCommission;
    } else {
      agentCommission = grossCommission * (agentSharePercentage / 100);
      officeCommission = grossCommission - agentCommission;
      companyCommission = officeCommission;
    }

    const commissionData = {
      ...this.newCommission,
      splitType,
      grossCommission,
      agentCommission,
      officeCommission,
      companyCommission,
      agent2Commission: agent2Commission || undefined,
      teamCommission: teamCommission || undefined,
      status: 'pending'
    };

    this.api.createCommission(commissionData).subscribe({
      next: (res: any) => {
        this.commissions.unshift(res);
        this.showAddDialog = false;
        this.newCommission = { salePrice: 0, commissionPercentage: 2.5, agentSharePercentage: 60, splitType: 'single' };
        this.loadStats();
        this.snackBar.open('Commission created successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open('Failed to create commission', 'Close', { duration: 3000 });
      }
    });
  }

  approveCommission(commission: Commission) {
    this.processingId = commission.id;
    this.api.updateCommissionStatus(commission.id, { status: 'approved' }).subscribe({
      next: (res: any) => {
        const index = this.commissions.findIndex(c => c.id === commission.id);
        if (index > -1) {
          this.commissions[index] = { ...this.commissions[index], ...res };
        }
        this.loadStats();
        this.snackBar.open('Commission approved', 'Close', { duration: 2000 });
        this.processingId = null;
      },
      error: (err) => {
        this.snackBar.open('Failed to approve commission', 'Close', { duration: 3000 });
        this.processingId = null;
      }
    });
  }

  markAsPaid(commission: Commission) {
    this.processingId = commission.id;
    this.api.updateCommissionStatus(commission.id, { status: 'paid', paidAmount: commission.agentCommission }).subscribe({
      next: (res: any) => {
        const index = this.commissions.findIndex(c => c.id === commission.id);
        if (index > -1) {
          this.commissions[index] = { ...this.commissions[index], ...res };
        }
        this.loadStats();
        this.snackBar.open('Commission marked as paid', 'Close', { duration: 2000 });
        this.processingId = null;
      },
      error: (err) => {
        this.snackBar.open('Failed to update commission', 'Close', { duration: 3000 });
        this.processingId = null;
      }
    });
  }

  deleteCommission(commission: Commission) {
    this.processingId = commission.id;
    this.api.deleteCommission(commission.id).subscribe({
      next: () => {
        this.commissions = this.commissions.filter(c => c.id !== commission.id);
        this.loadStats();
        this.snackBar.open('Commission deleted', 'Close', { duration: 2000 });
        this.processingId = null;
      },
      error: (err) => {
        this.snackBar.open('Failed to delete commission', 'Close', { duration: 3000 });
        this.processingId = null;
      }
    });
  }

  isProcessing(id: string): boolean {
    return this.processingId === id;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'paid': return 'status-paid';
      case 'disbursed': return 'status-disbursed';
      case 'approved': return 'status-approved';
      case 'pending': return 'status-pending';
      default: return '';
    }
  }

  closeDialog() {
    this.showAddDialog = false;
    this.newCommission = { salePrice: 0, commissionPercentage: 2.5, agentSharePercentage: 60, splitType: 'single' };
  }

  onSplitTypeChange() {
    this.newCommission.agent2Id = undefined;
    this.newCommission.agent2SharePercentage = undefined;
    this.newCommission.teamId = undefined;
  }

  hasMultiAgentOrTeam(commission: Commission): boolean {
    return commission.splitType === 'multi_agent' || commission.splitType === 'team';
  }
}
