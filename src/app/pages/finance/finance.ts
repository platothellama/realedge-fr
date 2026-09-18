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
  private readonly monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  categories = ['commission', 'rental', 'sale', 'consulting', 'marketing', 'salary', 'office', 'utilities', 'maintenance', 'other'];

  ngOnInit() {
    this.fetchTransactions();
    this.fetchSummary();
  }

  fetchTransactions() {
    this.loading = true;
    this.api.getTransactions().subscribe({
      next: (res: any) => {
        this.transactions = Array.isArray(res) ? res : (res?.data || []);
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to fetch transactions', err);
        this.loading = false;
        this.transactions = [];
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
    // QA 2026-09-18: all chart values coerced — Sequelize DECIMAL/SUM arrive
    // as STRINGS ("150000.00"), which used to string-concat into garbage.
    const num = (v: unknown) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };
    this.incomeVsExpenseData = [
      { label: 'Income', value: num(this.summary.totalIncome), color: '#10b981' },
      { label: 'Expenses', value: num(this.summary.totalExpenses), color: '#ef4444' }
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
      const key = t.category || 'other';
      catCount[key] = (catCount[key] || 0) + num(t.amount);
    });

    this.categoryData = Object.entries(catCount).map(([cat, amount]) => ({
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      value: amount,
      color: catColors[cat] || '#64748b'
    }));

    // QA 2026-09-18: monthly NET from the real summary endpoint (was
    // Math.random). Rows are {type, month (1-12), total}.
    const netByMonth: { [month: number]: number } = {};
    for (const row of this.summary.monthlyData || []) {
      const m = Number(row.month);
      if (!Number.isInteger(m) || m < 1 || m > 12) continue;
      netByMonth[m] = (netByMonth[m] || 0) + (row.type === 'income' ? num(row.total) : -num(row.total));
    }
    this.monthlyData = Object.keys(netByMonth)
      .map(Number)
      .sort((a, b) => a - b)
      .map((m) => ({
        label: this.monthNames[m - 1],
        value: netByMonth[m],
        color: netByMonth[m] >= 0 ? '#10b981' : '#ef4444'
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
    const v = Number(amount);
    if (!Number.isFinite(v)) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
  }
}
