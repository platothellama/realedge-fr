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
    FormsModule
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
  filterType = 'all';

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
      next: (res) => this.summary = res,
      error: (err) => console.error('Failed to fetch summary', err)
    });
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
