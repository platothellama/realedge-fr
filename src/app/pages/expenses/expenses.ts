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

interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  status: string;
  vendor?: string;
  description?: string;
}

@Component({
  selector: 'app-expenses',
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
  templateUrl: './expenses.html',
  styleUrl: './expenses.css'
})
export class ExpensesComponent implements OnInit {
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);

  loading = true;
  expenses: Expense[] = [];
  stats: any = {};
  
  categoryFilter = '';
  statusFilter = '';
  showAddDialog = false;
  
  newExpense: Partial<Expense> = {
    title: '',
    category: 'Other',
    amount: 0,
    status: 'Pending'
  };

  categoryOptions = ['Marketing', 'Operations', 'Salaries', 'Office Supplies', 'Travel', 'Software', 'Utilities', 'Maintenance', 'Legal', 'Other'];
  statusOptions = ['Pending', 'Approved', 'Rejected', 'Paid'];

  ngOnInit() {
    this.loadExpenses();
    this.loadStats();
  }

  loadExpenses() {
    this.loading = true;
    const filters: any = {};
    if (this.categoryFilter) filters.category = this.categoryFilter;
    if (this.statusFilter) filters.status = this.statusFilter;

    this.api.getExpenses(filters).subscribe({
      next: (res: any) => {
        this.expenses = Array.isArray(res) ? res : res.data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to fetch expenses', err);
        this.expenses = [];
        this.loading = false;
      }
    });
  }

  loadStats() {
    this.api.getExpenseStats().subscribe({
      next: (res) => {
        this.stats = res || {};
      },
      error: (err) => {
        console.error('Failed to fetch stats', err);
      }
    });
  }

  createExpense() {
    if (!this.newExpense.title || !this.newExpense.amount) {
      this.snackBar.open('Title and amount are required', 'Close', { duration: 3000 });
      return;
    }

    const expenseData = {
      ...this.newExpense,
      date: new Date()
    };

    this.api.createExpense(expenseData).subscribe({
      next: (res) => {
        this.expenses.unshift(res);
        this.showAddDialog = false;
        this.newExpense = { title: '', category: 'Other', amount: 0, status: 'Pending' };
        this.loadStats();
        this.snackBar.open('Expense created successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open('Failed to create expense', 'Close', { duration: 3000 });
      }
    });
  }

  approveExpense(expense: Expense) {
    this.api.approveExpense(expense.id).subscribe({
      next: (res: any) => {
        const index = this.expenses.findIndex(e => e.id === expense.id);
        if (index > -1) {
          this.expenses[index] = { ...this.expenses[index], ...res };
        }
        this.loadStats();
        this.snackBar.open('Expense approved', 'Close', { duration: 2000 });
      },
      error: (err) => {
        this.snackBar.open('Failed to approve expense', 'Close', { duration: 3000 });
      }
    });
  }

  markAsPaid(expense: Expense) {
    this.api.updateExpense(expense.id, { status: 'Paid', paidDate: new Date() }).subscribe({
      next: (res: any) => {
        const index = this.expenses.findIndex(e => e.id === expense.id);
        if (index > -1) {
          this.expenses[index] = { ...this.expenses[index], ...res };
        }
        this.loadStats();
        this.snackBar.open('Expense marked as paid', 'Close', { duration: 2000 });
      },
      error: (err) => {
        this.snackBar.open('Failed to update expense', 'Close', { duration: 3000 });
      }
    });
  }

  deleteExpense(expense: Expense) {
    this.api.deleteExpense(expense.id).subscribe({
      next: () => {
        this.expenses = this.expenses.filter(e => e.id !== expense.id);
        this.loadStats();
        this.snackBar.open('Expense deleted', 'Close', { duration: 2000 });
      },
      error: (err) => {
        this.snackBar.open('Failed to delete expense', 'Close', { duration: 3000 });
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Paid': return 'status-paid';
      case 'Approved': return 'status-approved';
      case 'Pending': return 'status-pending';
      case 'Rejected': return 'status-rejected';
      default: return '';
    }
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'Marketing': return 'campaign';
      case 'Operations': return 'settings';
      case 'Salaries': return 'payments';
      case 'Office Supplies': return 'inventory_2';
      case 'Travel': return 'flight';
      case 'Software': return 'code';
      case 'Utilities': return 'bolt';
      case 'Maintenance': return 'build';
      case 'Legal': return 'gavel';
      default: return 'receipt';
    }
  }

  closeDialog() {
    this.showAddDialog = false;
    this.newExpense = { title: '', category: 'Other', amount: 0, status: 'Pending' };
  }
}
