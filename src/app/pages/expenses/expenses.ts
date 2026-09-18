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
import { A11yModule } from '@angular/cdk/a11y';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApiService } from '../../services/api';
import { ConfirmDialogComponent } from '../../shared/molecules/confirm-dialog/confirm-dialog';
import { formatDateMed, formatMoney } from '../../shared/utils/format';
import { PageHeaderComponent } from '../../shared/molecules/page-header/page-header';
import { LoadingStateComponent } from '../../shared/atoms/loading-state/loading-state';
import { StatCardComponent } from '../../shared/molecules/stat-card/stat-card';
import { EmptyStateComponent } from '../../shared/atoms/empty-state/empty-state';
import { StatusBadgeComponent } from '../../shared/atoms/status-badge/status-badge';
import { DialogShellComponent } from '../../shared/molecules/dialog-shell/dialog-shell';

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
    MatDialogModule,
    FormsModule,
    A11yModule,
    PageHeaderComponent,
    LoadingStateComponent,
    StatCardComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    DialogShellComponent
  ],
  templateUrl: './expenses.html',
  styleUrl: './expenses.css'
})
export class ExpensesComponent implements OnInit {
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  loading = true;
  // QA 2026-09-18: double-click guard on creation.
  creatingExpense = false;
  expenses: Expense[] = [];
  stats: any = {};
  processingId: string | null = null;
  
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
        this.snackBar.open('Failed to load expenses', 'Retry', { duration: 5000 })
          .onAction().subscribe(() => this.loadExpenses());
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
    if (this.creatingExpense) return;
    if (!this.newExpense.title?.trim()) {
      this.snackBar.open('Title is required', 'Close', { duration: 3000 });
      return;
    }
    // QA 2026-09-18: !amount passes negatives (backend had no guard either —
    // now both sides require finite > 0).
    if (!Number.isFinite(this.newExpense.amount) || (this.newExpense.amount ?? 0) <= 0) {
      this.snackBar.open('Amount must be a positive number', 'Close', { duration: 3000 });
      return;
    }

    const expenseData = {
      ...this.newExpense,
      date: new Date()
    };

    this.creatingExpense = true;
    this.api.createExpense(expenseData).subscribe({
      next: (res) => {
        this.expenses.unshift((res as any)?.data ?? res);
        this.showAddDialog = false;
        this.newExpense = { title: '', category: 'Other', amount: 0, status: 'Pending' };
        this.loadStats();
        this.snackBar.open('Expense created successfully', 'Close', { duration: 3000 });
        this.creatingExpense = false;
      },
      error: (err) => {
        this.snackBar.open('Failed to create expense', 'Close', { duration: 3000 });
        this.creatingExpense = false;
      }
    });
  }

  approveExpense(expense: Expense) {
    this.processingId = expense.id;
    this.api.approveExpense(expense.id).subscribe({
      next: (res: any) => {
        const index = this.expenses.findIndex(e => e.id === expense.id);
        if (index > -1) {
          this.expenses[index] = { ...this.expenses[index], ...res };
        }
        this.loadStats();
        this.snackBar.open('Expense approved', 'Close', { duration: 2000 });
        this.processingId = null;
      },
      error: (err) => {
        this.snackBar.open('Failed to approve expense', 'Close', { duration: 3000 });
        this.processingId = null;
      }
    });
  }

  markAsPaid(expense: Expense) {
    this.processingId = expense.id;
    this.api.updateExpense(expense.id, { status: 'Paid', paidDate: new Date() }).subscribe({
      next: (res: any) => {
        const index = this.expenses.findIndex(e => e.id === expense.id);
        if (index > -1) {
          this.expenses[index] = { ...this.expenses[index], ...res };
        }
        this.loadStats();
        this.snackBar.open('Expense marked as paid', 'Close', { duration: 2000 });
        this.processingId = null;
      },
      error: (err) => {
        this.snackBar.open('Failed to update expense', 'Close', { duration: 3000 });
        this.processingId = null;
      }
    });
  }

  deleteExpense(expense: Expense) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      maxWidth: '95vw',
      data: {
        title: 'Delete expense?',
        message: `"${expense.title || 'This expense'}" will be permanently deleted. This cannot be undone.`,
        confirmLabel: 'Delete',
        destructive: true
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.processingId = expense.id;
      this.api.deleteExpense(expense.id).subscribe({
        next: () => {
          this.expenses = this.expenses.filter(e => e.id !== expense.id);
          this.loadStats();
          this.snackBar.open('Expense deleted', 'Close', { duration: 2000 });
          this.processingId = null;
        },
        error: (err) => {
          this.snackBar.open('Failed to delete expense', 'Close', { duration: 3000 });
          this.processingId = null;
        }
      });
    });
  }

  isProcessing(id: string): boolean {
    return this.processingId === id;
  }

  formatCurrency(value: number): string {
    return formatMoney(value);
  }

  formatDate(date: string): string {
    return formatDateMed(date);
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
