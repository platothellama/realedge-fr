import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';
import { ApiService } from '../../services/api';
import { DonutChartComponent, LineChartComponent } from '../../components/charts/charts';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    NgClass,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DonutChartComponent,
    LineChartComponent
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private api = inject(ApiService);
  user = this.auth.currentUser;

  loading = true;
  chartLoading = true;
  isSuperAdmin = signal(true);

  overview = {
    totalProperties: 0,
    totalLeads: 0,
    totalDeals: 0,
    totalUsers: 0,
    hotLeads: 0,
    totalRevenue: 0,
    pendingCommissions: 0,
    thisMonthRevenue: 0,
    totalExpenses: 0,
    netProfit: 0
  };

  userDashboard = {
    todayVisits: [] as any[],
    missedVisits: 0,
    upcomingVisits: [] as any[],
    contactedLeads: 0,
    uncontactedLeads: 0,
    propertiesOnHold: 0,
    propertiesNotHandled: 0,
    dealsOnHold: 0,
    dealsNotClosed: 0,
    totalCommissionEarned: 0,
    myHotLeads: 0,
    completedVisitsThisWeek: 0
  };

  propertyStatusData: { label: string; value: number; color: string }[] = [];
  propertyTypeData: { label: string; value: number; color: string }[] = [];
  leadSourcesData: { label: string; value: number; color: string }[] = [];
  leadStatusData: { label: string; value: number; color: string }[] = [];
  monthlyRevenueData: { label: string; value: number }[] = [];
  monthlyLabels: string[] = [];
  monthlyValues: number[] = [];

  recentProperties: any[] = [];
  recentLeads: any[] = [];
  recentDeals: any[] = [];
  topAgents: any[] = [];

  recentActivities: any[] = [];

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading = true;
    this.chartLoading = true;

    this.api.getDashboardStats().subscribe({
      next: (data: any) => {
        if (data) {
          this.isSuperAdmin.set(data.isSuperAdmin === true);
          this.overview = data.overview || this.overview;
          this.propertyStatusData = data.charts?.propertyByStatus || [];
          this.propertyTypeData = data.charts?.propertyByType || [];
          this.leadSourcesData = data.charts?.leadBySource || [];
          this.leadStatusData = data.charts?.leadByStatus || [];
          
          if (data.charts?.monthlyRevenue?.length > 0) {
            this.monthlyLabels = data.charts.monthlyRevenue.map((m: any) => this.formatMonthLabel(m.label));
            this.monthlyValues = data.charts.monthlyRevenue.map((m: any) => m.value || 0);
          } else {
            this.generateEmptyChart();
          }

          this.recentProperties = data.recent?.properties || [];
          this.recentLeads = data.recent?.leads || [];
          this.recentDeals = data.recent?.deals || [];
          this.topAgents = data.topAgents || [];

          if (data.userDashboard) {
            this.userDashboard = {
              todayVisits: data.userDashboard.todayVisits || [],
              missedVisits: data.userDashboard.missedVisits || 0,
              upcomingVisits: data.userDashboard.upcomingVisits || [],
              contactedLeads: data.userDashboard.contactedLeads || 0,
              uncontactedLeads: data.userDashboard.uncontactedLeads || 0,
              propertiesOnHold: data.userDashboard.propertiesOnHold || 0,
              propertiesNotHandled: data.userDashboard.propertiesNotHandled || 0,
              dealsOnHold: data.userDashboard.dealsOnHold || 0,
              dealsNotClosed: data.userDashboard.dealsNotClosed || 0,
              totalCommissionEarned: data.userDashboard.totalCommissionEarned || 0,
              myHotLeads: data.userDashboard.myHotLeads || 0,
              completedVisitsThisWeek: data.userDashboard.completedVisitsThisWeek || 0
            };
          }

          this.buildRecentActivities();
        }
        this.loading = false;
        this.chartLoading = false;
      },
      error: (err) => {
        console.error('Dashboard error:', err);
        this.loading = false;
        this.chartLoading = false;
        this.generateEmptyChart();
      }
    });
  }

  private buildRecentActivities() {
    const activities: any[] = [];

    this.recentProperties.forEach((p: any) => {
      activities.push({
        title: `New listing: ${p.title}`,
        time: p.createdAt,
        icon: 'home',
        type: 'property'
      });
    });

    this.recentLeads.forEach((l: any) => {
      activities.push({
        title: `New lead: ${l.name}`,
        time: l.createdAt,
        icon: 'person_add',
        type: 'lead'
      });
    });

    this.recentDeals.forEach((d: any) => {
      activities.push({
        title: `Deal: ${d.title}`,
        time: d.createdAt,
        icon: 'handshake',
        type: 'deal'
      });
    });

    this.recentActivities = activities
      .filter(a => a.time)
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10);
  }

  private formatMonthLabel(monthStr: string): string {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[parseInt(month) - 1] || monthStr;
  }

  private generateEmptyChart() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    this.monthlyLabels = months;
    this.monthlyValues = [0, 0, 0, 0, 0, 0];
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

  formatCurrency(value: number | undefined): string {
    if (!value) return '$0';
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'Available': 'badge-success',
      'Reserved': 'badge-warning',
      'Sold': 'badge-danger',
      'Rented': 'badge-info',
      'New Lead': 'badge-primary',
      'Contacted': 'badge-primary',
      'Qualified': 'badge-success',
      'Hot': 'badge-danger',
      'Negotiation': 'badge-warning',
      'Closed': 'badge-success',
      'Scheduled': 'badge-primary',
      'Completed': 'badge-success',
      'Cancelled': 'badge-muted',
      'No Show': 'badge-danger',
      'Visit Scheduled': 'badge-info',
      'Contract Signed': 'badge-warning'
    };
    return classes[status] || 'badge-primary';
  }

  formatVisitTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  getWelcomeMessage(): string {
    const role = this.user()?.role;
    if (role === 'Broker') return 'Broker Dashboard';
    if (role === 'Agent') return 'Agent Dashboard';
    if (role === 'Office Manager') return 'Office Manager Dashboard';
    if (role === 'Accountant') return 'Accountant Dashboard';
    if (role === 'Marketing') return 'Marketing Dashboard';
    return 'Business Overview';
  }
}
