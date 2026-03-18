import { Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../services/auth/auth.service';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatGridListModule, MatListModule, MatProgressSpinnerModule, CommonModule],
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
  propertyStatus: any[] = [];
  leadSources: any[] = [];
  propertiesByType: any[] = [];
  topProperties: any[] = [];
  attentionProperties: any[] = [];
  priceTrends: any[] = [];
  loading = true;

  constructor() {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading = true;
    
    this.api.getDashboardStats().subscribe({
      next: (res) => this.stats = res,
      error: (err) => console.error('Failed to fetch dashboard stats', err)
    });

    this.api.getLeads().subscribe({
      next: (leads) => {
        this.buildRecentActivities(leads, 'lead');
        this.buildLeadSources(leads);
      },
      error: (err) => console.error('Failed to fetch leads', err)
    });

    this.api.getDeals().subscribe({
      next: (deals) => {
        this.buildRecentActivities(deals, 'deal');
        this.calculateRevenue(deals);
      },
      error: (err) => console.error('Failed to fetch deals', err)
    });

    this.api.getVisits().subscribe({
      next: (visits) => {
        this.buildRecentActivities(visits, 'visit');
      },
      error: (err) => console.error('Failed to fetch visits', err)
    });

    this.api.getProperties().subscribe({
      next: (properties) => {
        this.buildPropertyStatus(properties);
        this.buildPropertiesByType(properties);
        this.buildTopProperties(properties);
        this.buildAttentionProperties(properties);
        this.calculatePriceTrends(properties);
      },
      error: (err) => console.error('Failed to fetch properties', err)
    });

    this.api.getUsers().subscribe({
      next: (res: any) => {
        if (res?.users) {
          this.topAgents = res.users
            .filter((u: any) => u.role === 'Broker' || u.role === 'Agent')
            .slice(0, 5);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to fetch users', err);
        this.loading = false;
      }
    });
  }

  buildRecentActivities(data: any[], type: string) {
    const activities = data.slice(0, 5).map((item: any) => {
      let title = '';
      let icon = '';
      
      switch (type) {
        case 'lead':
          title = `New Lead: ${item.name}`;
          icon = 'person_add';
          break;
        case 'deal':
          title = `Deal: ${item.title}`;
          icon = 'handshake';
          break;
        case 'visit':
          title = `Visit: ${item.title}`;
          icon = 'calendar_today';
          break;
      }

      return {
        title,
        time: this.getTimeAgo(item.createdAt),
        type,
        icon
      };
    });

    this.recentActivities = [...this.recentActivities, ...activities]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10);
  }

  buildPropertyStatus(properties: any[]) {
    const statusCount: { [key: string]: number } = {};
    properties.forEach(p => {
      statusCount[p.status] = (statusCount[p.status] || 0) + 1;
    });
    
    this.propertyStatus = Object.entries(statusCount).map(([status, count]) => ({
      status,
      count,
      percentage: properties.length > 0 ? Math.round((count / properties.length) * 100) : 0
    }));
  }

  buildPropertiesByType(properties: any[]) {
    const typeCount: { [key: string]: number } = {};
    properties.forEach(p => {
      typeCount[p.type] = (typeCount[p.type] || 0) + 1;
    });
    
    this.propertiesByType = Object.entries(typeCount).map(([type, count]) => ({
      type,
      count,
      percentage: properties.length > 0 ? Math.round((count / properties.length) * 100) : 0
    }));
  }

  buildTopProperties(properties: any[]) {
    this.topProperties = [...properties]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5)
      .map(p => ({
        title: p.title,
        views: p.views || 0,
        inquiries: p.inquiries || 0,
        status: p.status,
        price: p.price
      }));
  }

  buildAttentionProperties(properties: any[]) {
    this.attentionProperties = properties
      .filter(p => {
        const daysOnMarket = p.daysOnMarket || 0;
        const views = p.views || 0;
        const inquiries = p.inquiries || 0;
        return daysOnMarket > 30 || views === 0 || inquiries === 0;
      })
      .sort((a, b) => (b.daysOnMarket || 0) - (a.daysOnMarket || 0))
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        title: p.title,
        daysOnMarket: p.daysOnMarket || 0,
        views: p.views || 0,
        inquiries: p.inquiries || 0,
        price: p.price,
        issue: this.getPropertyIssue(p)
      }));
  }

  getPropertyIssue(property: any): string {
    const daysOnMarket = property.daysOnMarket || 0;
    const views = property.views || 0;
    const inquiries = property.inquiries || 0;
    const marketValue = property.marketValue || 0;
    const price = property.price || 0;

    if (daysOnMarket > 60) return 'Stale Listing';
    if (views === 0) return 'No Views';
    if (inquiries === 0) return 'No Inquiries';
    if (marketValue > 0 && price > marketValue * 1.1) return 'Overvalued';
    if (marketValue > 0 && price < marketValue * 0.9) return 'Undervalued';
    return 'Needs Attention';
  }

  getIssueColor(issue: string): string {
    switch (issue) {
      case 'Stale Listing': return '#ef4444';
      case 'No Views': return '#f59e0b';
      case 'No Inquiries': return '#f59e0b';
      case 'Overvalued': return '#ef4444';
      case 'Undervalued': return '#10b981';
      default: return '#64748b';
    }
  }

  calculatePriceTrends(properties: any[]) {
    const avgPrice = properties.length > 0 
      ? properties.reduce((sum, p) => sum + Number(p.price || 0), 0) / properties.length 
      : 0;
    
    const avgPricePerSqm = properties.length > 0
      ? properties.reduce((sum, p) => sum + (p.area > 0 ? Number(p.price || 0) / p.area : 0), 0) / properties.filter(p => p.area > 0).length
      : 0;

    this.priceTrends = [
      { label: 'Avg. Price', value: avgPrice, icon: 'price_change', color: '#6366f1' },
      { label: 'Avg. Price/m²', value: avgPricePerSqm, icon: 'grid_on', color: '#10b981' },
      { label: 'Total Views', value: properties.reduce((sum, p) => sum + (p.views || 0), 0), icon: 'visibility', color: '#f59e0b' },
      { label: 'Total Inquiries', value: properties.reduce((sum, p) => sum + (p.inquiries || 0), 0), icon: 'question_answer', color: '#8b5cf6' }
    ];
  }

  buildLeadSources(leads: any[]) {
    const sourceCount: { [key: string]: number } = {};
    leads.forEach(l => {
      sourceCount[l.source] = (sourceCount[l.source] || 0) + 1;
    });
    
    this.leadSources = Object.entries(sourceCount).map(([source, count]) => ({
      source,
      count,
      percentage: leads.length > 0 ? Math.round((count / leads.length) * 100) : 0
    }));
  }

  totalRevenue = 0;
  totalCommission = 0;

  calculateRevenue(deals: any[]) {
    this.totalRevenue = deals.reduce((sum, d) => sum + (d.finalPrice || 0), 0);
    this.totalCommission = deals.reduce((sum, d) => sum + (d.commission || 0), 0);
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

  getActivityIcon(type: string): string {
    switch (type) {
      case 'lead': return 'person_add';
      case 'deal': return 'handshake';
      case 'visit': return 'calendar_today';
      default: return 'notifications';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Available': return '#10b981';
      case 'Reserved': return '#f59e0b';
      case 'Sold': return '#ef4444';
      case 'Rented': return '#6366f1';
      default: return '#64748b';
    }
  }

  getSourceIcon(source: string): string {
    switch (source) {
      case 'Website': return 'language';
      case 'Facebook': return 'facebook';
      case 'Google Ads': return 'ads_click';
      case 'Referral': return 'person';
      case 'Walk-in': return 'door_front';
      default: return 'source';
    }
  }
}
