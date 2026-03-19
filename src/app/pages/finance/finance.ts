import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { DonutChartComponent, BarChartComponent } from '../../components/charts/charts';

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatDialogModule,
    FormsModule,
    DonutChartComponent,
    BarChartComponent
  ],
  templateUrl: './finance.html',
  styleUrl: './finance.css'
})
export class FinanceComponent implements OnInit {
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  transactions: any[] = [];
  summary: any = {};
  loading = true;
  chartLoading = true;
  filterType = 'all';

  incomeVsExpenseData: { label: string; value: number; color: string }[] = [];
  categoryData: { label: string; value: number; color: string }[] = [];
  monthlyData: { label: string; value: number; color: string }[] = [];
  monthlyLabels: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

  categories = ['commission', 'rental', 'sale', 'consulting', 'marketing', 'salary', 'office', 'utilities', 'maintenance', 'other'];

  ngOnInit() {
    this.fetchTransactions();
    this.fetchSummary();
  }

  fetchTransactions() {
    this.loading = true;
    this.api.getTransactions().subscribe({
      next: (res) => {
        this.transactions = res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to fetch transactions', err);
        this.loading = false;
        this.transactions = this.getMockTransactions();
      }
    });
  }

  fetchSummary() {
    this.api.getFinancialSummary().subscribe({
      next: (res) => {
        this.summary = res;
        this.generateChartData();
        this.chartLoading = false;
      },
      error: (err) => {
        console.error('Failed to fetch summary', err);
        this.chartLoading = false;
      }
    });
  }

  private generateChartData() {
    this.incomeVsExpenseData = [
      { label: 'Income', value: this.summary.totalIncome || 0, color: '#10b981' },
      { label: 'Expenses', value: this.summary.totalExpenses || 0, color: '#ef4444' }
    ];

    const catColors: { [key: string]: string } = {
      commission: '#3b82f6',
      rental: '#10b981',
      sale: '#8b5cf6',
      consulting: '#f59e0b',
      marketing: '#ef4444',
      salary: '#6366f1',
      office: '#06b6d4',
      utilities: '#84cc16',
      maintenance: '#f97316',
      other: '#64748b'
    };
    
    const catCount: { [key: string]: number } = {};
    this.transactions.forEach(t => {
      catCount[t.category] = (catCount[t.category] || 0) + t.amount;
    });
    
    this.categoryData = Object.entries(catCount).map(([cat, amount]) => ({
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      value: amount,
      color: catColors[cat] || '#64748b'
    }));

    this.monthlyData = this.monthlyLabels.map((_, i) => ({
      label: this.monthlyLabels[i],
      value: Math.floor(Math.random() * 50000) + 10000,
      color: i % 2 === 0 ? '#10b981' : '#ef4444'
    }));
  }

  get filteredTransactions() {
    if (this.filterType === 'all') return this.transactions;
    return this.transactions.filter(t => t.type === this.filterType);
  }

  getCategoryIcon(category: string): string {
    const icons: any = {
      commission: 'percent',
      rental: 'home',
      sale: 'handshake',
      consulting: 'support_agent',
      marketing: 'campaign',
      salary: 'payments',
      office: 'business',
      utilities: 'bolt',
      maintenance: 'build',
      other: 'more_horiz'
    };
    return icons[category] || 'attach_money';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  }

  getMockTransactions() {
    return [
      { id: '1', type: 'income', category: 'commission', amount: 150000, date: new Date(), description: 'Commission - Villa Sale', status: 'completed' },
      { id: '2', type: 'income', category: 'rental', amount: 25000, date: new Date(), description: 'Monthly Rent - Apt 402', status: 'completed' },
      { id: '3', type: 'expense', category: 'salary', amount: 12000, date: new Date(), description: 'Agent Salary - January', status: 'completed' },
      { id: '4', type: 'expense', category: 'marketing', amount: 3500, date: new Date(), description: 'Digital Marketing Campaign', status: 'completed' },
      { id: '5', type: 'income', category: 'sale', amount: 45000, date: new Date(), description: 'Property Sale Commission', status: 'completed' }
    ];
  }
}
