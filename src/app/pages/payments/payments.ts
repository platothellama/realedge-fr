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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

interface Payment {
  id: string;
  dealId: string;
  deal?: any;
  installmentNumber?: number;
  payerName: string;
  payerPhone?: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  amountInUSD: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string;
  bankName?: string;
  notes?: string;
  status: string;
  recorder?: any;
}

interface PaymentPlan {
  id: string;
  dealId: string;
  deal?: any;
  planName: string;
  totalAmount: number;
  currency: string;
  numberOfInstallments: number;
  startDate: string;
  endDate?: string;
  installmentAmount: number;
  status: string;
  notes?: string;
  creator?: any;
}

@Component({
  selector: 'app-payments',
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
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MatTooltipModule,
    FormsModule
  ],
  templateUrl: './payments.html',
  styleUrl: './payments.css'
})
export class PaymentsComponent implements OnInit {
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  loading = true;
  payments: Payment[] = [];
  paymentPlans: PaymentPlan[] = [];
  cashTracking: any = null;

  deals: any[] = [];
  selectedTab = 0;
  processingId: string | null = null;

  showAddPaymentDialog = false;
  showAddPlanDialog = false;

  newPayment: Partial<Payment> = {
    payerName: '',
    amount: 0,
    currency: 'USD',
    exchangeRate: 1,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash'
  };

  newPlan: Partial<PaymentPlan> = {
    planName: '',
    totalAmount: 0,
    currency: 'USD',
    numberOfInstallments: 1,
    startDate: new Date().toISOString().split('T')[0],
    installmentAmount: 0
  };

  paymentMethodOptions = ['Cash', 'Bank Transfer', 'Check', 'Western Union', 'Money Transfer', 'Other'];
  currencyOptions = ['USD', 'LBP'];
  planStatusOptions = ['Active', 'Completed', 'Cancelled', 'Defaulted'];
  paymentStatusOptions = ['Pending', 'Confirmed', 'Rejected', 'Refunded'];

  filterDealId = '';

  ngOnInit() {
    this.loadDeals();
    this.loadPayments();
  }

  loadDeals() {
    this.api.getDeals().subscribe({
      next: (res) => {
        this.deals = Array.isArray(res) ? res : res.data || [];
      },
      error: (err) => console.error('Failed to load deals', err)
    });
  }

  loadPayments() {
    this.loading = true;
    const filters: any = {};
    if (this.filterDealId) filters.dealId = this.filterDealId;

    this.api.getPayments(filters).subscribe({
      next: (res) => {
        this.payments = Array.isArray(res) ? res : res.data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to fetch payments', err);
        this.payments = [];
        this.loading = false;
      }
    });
  }

  loadPaymentPlans() {
    const filters: any = {};
    if (this.filterDealId) filters.dealId = this.filterDealId;

    this.api.getPaymentPlans(filters).subscribe({
      next: (res) => {
        this.paymentPlans = Array.isArray(res) ? res : res.data || [];
      },
      error: (err) => {
        console.error('Failed to fetch payment plans', err);
        this.paymentPlans = [];
      }
    });
  }

  loadCashTracking() {
    this.api.getCashTracking().subscribe({
      next: (res) => {
        this.cashTracking = res;
      },
      error: (err) => {
        console.error('Failed to fetch cash tracking', err);
        this.cashTracking = null;
      }
    });
  }

  onTabChange(index: number) {
    this.selectedTab = index;
    if (index === 0) this.loadPayments();
    else if (index === 1) this.loadPaymentPlans();
    else if (index === 2) this.loadCashTracking();
  }

  createPayment() {
    if (!this.newPayment.dealId) {
      this.snackBar.open('Please select a deal', 'Close', { duration: 3000 });
      return;
    }
    if (!this.newPayment.payerName) {
      this.snackBar.open('Payer name is required', 'Close', { duration: 3000 });
      return;
    }
    if (!this.newPayment.amount || this.newPayment.amount <= 0) {
      this.snackBar.open('Valid amount is required', 'Close', { duration: 3000 });
      return;
    }

    const paymentData: any = {
      ...this.newPayment,
      paymentDate: new Date(this.newPayment.paymentDate!)
    };

    this.api.createPayment(paymentData).subscribe({
      next: (res) => {
        this.payments.unshift(res);
        this.showAddPaymentDialog = false;
        this.resetPaymentForm();
        this.snackBar.open('Payment recorded successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open('Failed to create payment: ' + (err.error?.message || 'Unknown error'), 'Close', { duration: 3000 });
      }
    });
  }

  createPaymentPlan() {
    if (!this.newPlan.dealId) {
      this.snackBar.open('Please select a deal', 'Close', { duration: 3000 });
      return;
    }
    if (!this.newPlan.planName) {
      this.snackBar.open('Plan name is required', 'Close', { duration: 3000 });
      return;
    }
    if (!this.newPlan.totalAmount || this.newPlan.totalAmount <= 0) {
      this.snackBar.open('Valid total amount is required', 'Close', { duration: 3000 });
      return;
    }

    const planData: any = {
      ...this.newPlan,
      startDate: new Date(this.newPlan.startDate!),
      endDate: this.newPlan.endDate ? new Date(this.newPlan.endDate!) : null
    };

    this.api.createPaymentPlan(planData).subscribe({
      next: (res) => {
        this.paymentPlans.unshift(res);
        this.showAddPlanDialog = false;
        this.resetPlanForm();
        this.snackBar.open('Payment plan created successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open('Failed to create payment plan: ' + (err.error?.message || 'Unknown error'), 'Close', { duration: 3000 });
      }
    });
  }

  deletePayment(payment: Payment) {
    if (!confirm('Are you sure you want to delete this payment?')) return;

    this.processingId = payment.id;
    this.api.deletePayment(payment.id).subscribe({
      next: () => {
        this.payments = this.payments.filter(p => p.id !== payment.id);
        this.processingId = null;
        this.snackBar.open('Payment deleted', 'Close', { duration: 2000 });
      },
      error: (err) => {
        this.snackBar.open('Failed to delete payment', 'Close', { duration: 3000 });
        this.processingId = null;
      }
    });
  }

  deletePaymentPlan(plan: PaymentPlan) {
    if (!confirm('Are you sure you want to delete this payment plan?')) return;

    this.processingId = plan.id;
    this.api.deletePaymentPlan(plan.id).subscribe({
      next: () => {
        this.paymentPlans = this.paymentPlans.filter(p => p.id !== plan.id);
        this.processingId = null;
        this.snackBar.open('Payment plan deleted', 'Close', { duration: 2000 });
      },
      error: (err) => {
        this.snackBar.open('Failed to delete payment plan', 'Close', { duration: 3000 });
        this.processingId = null;
      }
    });
  }

  isProcessing(id: string): boolean {
    return this.processingId === id;
  }

  formatCurrency(value: number, currency: string = 'USD'): string {
    if (currency === 'LBP') {
      return new Intl.NumberFormat('en-LB', { style: 'decimal', maximumFractionDigits: 0 }).format(value) + ' LBP';
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Confirmed': case 'Active': case 'Completed': return 'status-active';
      case 'Pending': return 'status-pending';
      case 'Rejected': case 'Cancelled': case 'Defaulted': return 'status-inactive';
      default: return '';
    }
  }

  getPaymentMethodIcon(method: string): string {
    switch (method) {
      case 'Cash': return 'payments';
      case 'Bank Transfer': return 'account_balance';
      case 'Check': return 'receipt';
      case 'Western Union': case 'Money Transfer': return 'send';
      default: return 'money';
    }
  }

  resetPaymentForm() {
    this.newPayment = {
      payerName: '',
      amount: 0,
      currency: 'USD',
      exchangeRate: 1,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'Cash'
    };
  }

  resetPlanForm() {
    this.newPlan = {
      planName: '',
      totalAmount: 0,
      currency: 'USD',
      numberOfInstallments: 1,
      startDate: new Date().toISOString().split('T')[0],
      installmentAmount: 0
    };
  }

  closePaymentDialog() {
    this.showAddPaymentDialog = false;
    this.resetPaymentForm();
  }

  closePlanDialog() {
    this.showAddPlanDialog = false;
    this.resetPlanForm();
  }

  onAmountChange() {
    if (this.newPlan.numberOfInstallments && this.newPlan.totalAmount) {
      this.newPlan.installmentAmount = Number((this.newPlan.totalAmount / this.newPlan.numberOfInstallments).toFixed(2));
    }
  }
}