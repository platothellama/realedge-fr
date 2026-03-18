import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

interface MarketMetric {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
}

interface PropertyMarketData {
  location: string;
  avgPrice: number;
  priceChange: number;
  avgDaysOnMarket: number;
  inventory: number;
  demand: 'high' | 'medium' | 'low';
}

interface Methodology {
  title: string;
  calculation: string;
  source: string;
  details: string;
}

@Component({
  selector: 'app-market',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatExpansionModule,
    FormsModule
  ],
  templateUrl: './market.html',
  styleUrl: './market.css'
})
export class MarketComponent implements OnInit {
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);

  loading = true;
  selectedPeriod = 'month';

  metrics: MarketMetric[] = [];
  marketData: PropertyMarketData[] = [];
  topPerformers: any[] = [];
  aiInsights: any[] = [];
  methodology: { [key: string]: Methodology } = {};

  periods = [
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'quarter', label: 'Last Quarter' },
    { value: 'year', label: 'Last Year' }
  ];

  ngOnInit() {
    this.loadMarketData();
  }

  loadMarketData() {
    this.loading = true;
    this.api.getMarketIntelligence(this.selectedPeriod).subscribe({
      next: (res) => {
        this.metrics = res.metrics || this.getMockMetrics();
        this.marketData = res.marketData || this.getMockMarketData();
        this.topPerformers = res.topPerformers || this.getMockTopPerformers();
        this.aiInsights = res.insights || this.getMockInsights();
        this.methodology = res.methodology || {};
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to fetch market data', err);
        this.metrics = this.getMockMetrics();
        this.marketData = this.getMockMarketData();
        this.topPerformers = this.getMockTopPerformers();
        this.aiInsights = this.getMockInsights();
        this.loading = false;
      }
    });
  }

  refreshData() {
    this.loadMarketData();
    this.snackBar.open('Market data refreshed', 'Close', { duration: 2000 });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0 
    }).format(value);
  }

  getTrendIcon(trend: string): string {
    return trend === 'up' ? 'trending_up' : trend === 'down' ? 'trending_down' : 'trending_flat';
  }

  getDemandClass(demand: string): string {
    return `demand-${demand}`;
  }

  get methodologyKeys(): string[] {
    return Object.keys(this.methodology);
  }

  getMockMetrics(): MarketMetric[] {
    return [
      { label: 'Avg. Sale Price', value: '$485,000', change: 8.5, trend: 'up', icon: 'attach_money' },
      { label: 'Avg. Days on Market', value: '34', change: -12, trend: 'down', icon: 'schedule' },
      { label: 'Total Transactions', value: '1,247', change: 15.2, trend: 'up', icon: 'swap_horiz' },
      { label: 'Inventory Level', value: '892', change: -5.3, trend: 'down', icon: 'inventory_2' },
      { label: 'Price per SQM', value: '$342', change: 3.2, trend: 'up', icon: 'square_foot' },
      { label: 'Market Index', value: '124.5', change: 2.1, trend: 'up', icon: 'analytics' }
    ];
  }

  getMockMarketData(): PropertyMarketData[] {
    return [
      { location: 'Downtown', avgPrice: 625000, priceChange: 12.5, avgDaysOnMarket: 28, inventory: 145, demand: 'high' },
      { location: 'Suburban Areas', avgPrice: 385000, priceChange: 7.2, avgDaysOnMarket: 35, inventory: 312, demand: 'high' },
      { location: 'Waterfront', avgPrice: 895000, priceChange: 5.8, avgDaysOnMarket: 45, inventory: 67, demand: 'medium' },
      { location: 'City Center', avgPrice: 520000, priceChange: 9.3, avgDaysOnMarket: 32, inventory: 189, demand: 'high' },
      { location: 'Rural', avgPrice: 275000, priceChange: 3.1, avgDaysOnMarket: 52, inventory: 98, demand: 'low' },
      { location: 'Historic District', avgPrice: 445000, priceChange: 6.7, avgDaysOnMarket: 38, inventory: 81, demand: 'medium' }
    ];
  }

  getMockTopPerformers() {
    return [
      { name: 'Downtown Condos', transactions: 89, volume: 42500000, avgPrice: 477000 },
      { name: 'Suburban Family Homes', transactions: 156, volume: 58500000, avgPrice: 375000 },
      { name: 'Waterfront Properties', transactions: 34, volume: 28900000, avgPrice: 850000 },
      { name: 'City Center Apartments', transactions: 112, volume: 34200000, avgPrice: 305000 },
      { name: 'New Developments', transactions: 67, volume: 28900000, avgPrice: 431000 }
    ];
  }

  getMockInsights() {
    return [
      { type: 'opportunity', title: 'High Demand in Suburban Areas', description: 'Suburban properties are selling 23% faster than city center properties. Consider increasing inventory.' },
      { type: 'warning', title: 'Inventory Shortage', description: 'Downtown inventory is 15% below last month. Prices may increase due to supply constraints.' },
      { type: 'trend', title: 'Price Growth Stabilizing', description: 'Year-over-year price growth has stabilized at 7.2%, down from 12% last year.' },
      { type: 'opportunity', title: 'Investment Opportunity', description: 'Waterfront properties showing strong appreciation potential with 5-year projection of 15%.' }
    ];
  }
}
