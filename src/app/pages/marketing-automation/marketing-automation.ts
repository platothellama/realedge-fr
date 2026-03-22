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

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  subject: string;
  content: string;
  triggerType: string;
  stats?: { sent: number; opened: number; clicked: number };
  createdAt: string;
}

@Component({
  selector: 'app-marketing-automation',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatTableModule,
    MatMenuModule, MatChipsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, FormsModule
  ],
  templateUrl: './marketing-automation.html',
  styleUrl: './marketing-automation.css'
})
export class MarketingAutomationComponent implements OnInit {
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);

  loading = true;
  campaigns: Campaign[] = [];
  stats: any = {};
  showAddDialog = false;
  
  newCampaign: Partial<Campaign> = {
    name: '', type: 'email', status: 'draft', subject: '', content: '', triggerType: 'manual'
  };

  typeOptions = ['email', 'sms', 'drip', 'followup', 'nurture'];
  statusOptions = ['draft', 'active', 'paused', 'completed'];

  ngOnInit() {
    this.loadCampaigns();
    this.loadStats();
  }

  loadCampaigns() {
    this.api.getCampaigns().subscribe({
      next: (res: any) => {
        this.campaigns = Array.isArray(res) ? res : (res?.data || []);
        this.loading = false;
      },
      error: () => { this.campaigns = []; this.loading = false; }
    });
  }

  loadStats() {
    this.api.getCampaignStats().subscribe({
      next: (res) => { this.stats = res || {}; },
      error: () => {}
    });
  }

  createCampaign() {
    if (!this.newCampaign.name) {
      this.snackBar.open('Campaign name is required', 'Close', { duration: 3000 });
      return;
    }
    this.api.createCampaign(this.newCampaign).subscribe({
      next: (res: any) => {
        this.campaigns.unshift(res);
        this.showAddDialog = false;
        this.newCampaign = { name: '', type: 'email', status: 'draft', subject: '', content: '', triggerType: 'manual' };
        this.loadStats();
        this.snackBar.open('Campaign created', 'Close', { duration: 2000 });
      },
      error: () => this.snackBar.open('Error creating campaign', 'Close', { duration: 3000 })
    });
  }

  sendCampaign(campaign: Campaign) {
    this.api.sendCampaign(campaign.id).subscribe({
      next: () => {
        this.loadCampaigns();
        this.loadStats();
        this.snackBar.open('Campaign sent', 'Close', { duration: 2000 });
      },
      error: () => this.snackBar.open('Error sending campaign', 'Close', { duration: 3000 })
    });
  }

  deleteCampaign(campaign: Campaign) {
    this.api.deleteCampaign(campaign.id).subscribe({
      next: () => {
        this.campaigns = this.campaigns.filter(c => c.id !== campaign.id);
        this.loadStats();
        this.snackBar.open('Campaign deleted', 'Close', { duration: 2000 });
      },
      error: () => this.snackBar.open('Error deleting campaign', 'Close', { duration: 3000 })
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active': return 'status-active';
      case 'completed': return 'status-completed';
      case 'paused': return 'status-paused';
      default: return 'status-draft';
    }
  }
}
