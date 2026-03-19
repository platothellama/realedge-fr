import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';
import { ApiService } from '../../services/api';
import { DonutChartComponent, BarChartComponent, LineChartComponent } from '../../components/charts/charts';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DonutChartComponent,
    BarChartComponent,
    LineChartComponent
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private api = inject(ApiService);
  user = this.auth.currentUser;

  stats: any[] = [];
  recentActivities: any[] = [];
  topAgents: any[] = [];
  negotiations: any[] = [];
  loading = true;
  chartLoading = true;

  propertyStatusData: { label: string; value: number; color: string }[] = [];
  leadSourcesData: { label: string; value: number; color: string }[] = [];
  propertiesByTypeData: { label: string; value: number; color: string }[] = [];
  monthlyRevenueData: number[] = [];
  monthlyLabels: string[] = [];
  leadConversionData: number[] = [];
  conversionLabels: string[] = [];

  totalRevenue = 0;
  totalCommission = 0;
  totalProperties = 0;
  totalLeads = 0;
  totalDeals = 0;
  avgPrice = 0;

  constructor() {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading = true;
    this.chartLoading = true;

    forkJoin({
      dashboardStats: this.api.getDashboardStats(),
      leads: this.api.getLeads(),
      deals: this.api.getDeals(),
      properties: this.api.getProperties(),
      visits: this.api.getVisits(),
      users: this.api.getUsers()
    }).subscribe({
      next: (data) => {
        this.stats = data.dashboardStats;
        this.processLeads(data.leads);
        this.processDeals(data.deals);
        this.processProperties(data.properties);
        this.processVisits(data.visits);
        this.processUsers(data.users);
        this.generateMockChartData();
        this.loading = false;
        this.chartLoading = false;
      },
      error: (err) => {
        console.error('Dashboard error:', err);
        this.loading = false;
        this.chartLoading = false;
      }
    });
  }

  private processLeads(leads: any[]) {
    this.totalLeads = leads.length;
    const sourceColors: { [key: string]: string } = {
      'Website': '#3b82f6',
      'Facebook': '#8b5cf6',
      'Google Ads': '#f59e0b',
      'Referral': '#10b981',
      'Walk-in': '#ef4444',
      'Other': '#64748b'
    };
    
    const sourceCount: { [key: string]: number } = {};
    leads.forEach(l => {
      sourceCount[l.source || 'Other'] = (sourceCount[l.source || 'Other'] || 0) + 1;
    });
    
    this.leadSourcesData = Object.entries(sourceCount).map(([source, count]) => ({
      label: source,
      value: count,
      color: sourceColors[source] || '#64748b'
    }));

    const statuses = ['New', 'Contacted', 'Qualified', 'Negotiation', 'Visit Scheduled'];
    this.leadConversionData = statuses.map(status => 
      leads.filter(l => l.status === status).length
    );
    this.conversionLabels = statuses;
  }

  private processDeals(deals: any[]) {
    this.totalDeals = deals.length;
    this.totalRevenue = deals.reduce((sum, d) => sum + (d.finalPrice || 0), 0);
    this.totalCommission = deals.reduce((sum, d) => sum + (d.commission || 0), 0);
    
    const recent = deals.slice(0, 5).map(d => ({
      title: `Deal: ${d.title}`,
      time: this.getTimeAgo(d.createdAt),
      type: 'deal',
      icon: 'handshake'
    }));
    this.recentActivities = [...this.recentActivities, ...recent]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10);
  }

  private processProperties(properties: any[]) {
    this.totalProperties = properties.length;
    this.avgPrice = properties.length > 0 
      ? properties.reduce((sum, p) => sum + Number(p.price || 0), 0) / properties.length 
      : 0;

    const statusColors: { [key: string]: string } = {
      'Available': '#10b981',
      'Reserved': '#f59e0b',
      'Sold': '#ef4444',
      'Rented': '#3b82f6'
    };
    
    const statusCount: { [key: string]: number } = {};
    properties.forEach(p => {
      statusCount[p.status || 'Other'] = (statusCount[p.status || 'Other'] || 0) + 1;
    });
    
    this.propertyStatusData = Object.entries(statusCount).map(([status, count]) => ({
      label: status,
      value: count,
      color: statusColors[status] || '#64748b'
    }));

    const typeColors: { [key: string]: string } = {
      'Apartment': '#3b82f6',
      'House': '#10b981',
      'Villa': '#8b5cf6',
      'Office': '#f59e0b',
      'Land': '#ef4444',
      'Commercial': '#06b6d4'
    };
    
    const typeCount: { [key: string]: number } = {};
    properties.forEach(p => {
      typeCount[p.type || 'Other'] = (typeCount[p.type || 'Other'] || 0) + 1;
    });
    
    this.propertiesByTypeData = Object.entries(typeCount).map(([type, count]) => ({
      label: type,
      value: count,
      color: typeColors[type] || '#64748b'
    }));
  }

  private processVisits(visits: any[]) {
    const recent = visits.slice(0, 5).map(v => ({
      title: `Visit: ${v.title || 'Property Visit'}`,
      time: this.getTimeAgo(v.createdAt),
      type: 'visit',
      icon: 'calendar_today'
    }));
    this.recentActivities = [...this.recentActivities, ...recent]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10);
  }

  private processUsers(users: any) {
    const userList = users?.users || users || [];
    this.topAgents = userList
      .filter((u: any) => u.role === 'Broker' || u.role === 'Agent')
      .slice(0, 5);
  }

  private generateMockChartData() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    this.monthlyLabels = months;
    this.monthlyRevenueData = months.map(() => Math.floor(Math.random() * 500000) + 100000);
  }

  getTimeAgo(dateString: string): string {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  formatCurrency(value: number): string {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  }

  get conversionBarData() {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    return this.conversionLabels.map((label, i) => ({
      label,
      value: this.leadConversionData[i] || 0,
      color: colors[i % colors.length]
    }));
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'Available': '#10b981',
      'Reserved': '#f59e0b',
      'Sold': '#ef4444',
      'Rented': '#6366f1'
    };
    return colors[status] || '#64748b';
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'lead': return 'person_add';
      case 'deal': return 'handshake';
      case 'visit': return 'calendar_today';
      default: return 'notifications';
    }
  }
}
