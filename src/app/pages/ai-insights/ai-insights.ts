import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

interface Prediction {
  type: string;
  title: string;
  value: string;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  description: string;
}

interface LeadScore {
  id: string;
  name: string;
  score: number;
  factors: string[];
  recommendation: string;
}

interface PropertyValuation {
  propertyId: string;
  propertyTitle: string;
  currentPrice: number;
  estimatedValue: number;
  pricePerSqm: number;
  marketTrend: string;
  confidence: number;
}

@Component({
  selector: 'app-ai-insights',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule,
    FormsModule
  ],
  templateUrl: './ai-insights.html',
  styleUrl: './ai-insights.css'
})
export class AiInsightsComponent implements OnInit {
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);

  loading = true;
  selectedTab = 'predictions';

  predictions: Prediction[] = [];
  leadScores: LeadScore[] = [];
  propertyValuations: PropertyValuation[] = [];

  summary: any = {};

  insights = [
    { type: 'valuation', title: 'Property Valuation', icon: 'home', description: 'AI-powered property valuations based on comparable properties in the same area and type.' },
    { type: 'leads', title: 'Lead Scoring', icon: 'people', description: 'Lead scores calculated from budget, source, status, and engagement factors.' },
    { type: 'market', title: 'Market Predictions', icon: 'trending_up', description: 'Predictions based on historical data, current pipeline, and conversion rates.' },
    { type: 'pricing', title: 'Smart Pricing', icon: 'sell', description: 'Pricing recommendations comparing your properties to similar listings.' }
  ];

  ngOnInit() {
    this.loadAiInsights();
  }

  loadAiInsights() {
    this.loading = true;
    
    this.api.getAiInsights().subscribe({
      next: (res) => {
        this.predictions = res.predictions || [];
        this.leadScores = res.leadScores || [];
        this.propertyValuations = res.propertyValuations || [];
        this.summary = res.summary || {};
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to fetch AI insights', err);
        this.predictions = [];
        this.leadScores = [];
        this.propertyValuations = [];
        this.summary = {};
        this.loading = false;
      }
    });
  }

  getScoreColor(score: number): string {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  }

  getConfidenceColor(confidence: number): string {
    if (confidence >= 85) return '#10b981';
    if (confidence >= 70) return '#3b82f6';
    return '#f59e0b';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0 
    }).format(value);
  }

  refreshInsights() {
    this.loadAiInsights();
    this.snackBar.open('AI insights refreshed', 'Close', { duration: 2000 });
  }

  getTrendIcon(trend: string): string {
    return trend === 'up' ? 'trending_up' : trend === 'down' ? 'trending_down' : 'trending_flat';
  }

  getValuationClass(trend: string): string {
    return trend === 'Rising' ? 'trend-up' : trend === 'Declining' ? 'trend-down' : 'trend-stable';
  }
}
