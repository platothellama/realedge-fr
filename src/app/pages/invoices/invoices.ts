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
import { FormsModule } from '@angular/forms';
import { A11yModule } from '@angular/cdk/a11y';
import { ApiService } from '../../services/api';
import { ClientSelectorComponent, ClientSelection } from '../../shared/molecules/client-selector/client-selector';
import { ConfirmDialogComponent } from '../../shared/molecules/confirm-dialog/confirm-dialog';
import { DialogShellComponent } from '../../shared/molecules/dialog-shell/dialog-shell';
import { ErrorStateComponent } from '../../shared/atoms/error-state/error-state';
import { formatDateMed, formatMoney, formatMoneyUSD } from '../../shared/utils/format';
import { PageHeaderComponent } from '../../shared/molecules/page-header/page-header';
import { LoadingStateComponent } from '../../shared/atoms/loading-state/loading-state';
import { StatCardComponent } from '../../shared/molecules/stat-card/stat-card';
import { EmptyStateComponent } from '../../shared/atoms/empty-state/empty-state';
import { StatusBadgeComponent } from '../../shared/atoms/status-badge/status-badge';

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  type: string;
  status: string;
  currency: string;
  issueDate: string;
  supplyDate?: string;
  dueDate: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  clientTaxId?: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  lineItems: LineItem[];
  notes?: string;
  paymentTerms?: string;
  paidAmount: number;
  paidDate?: string;
  sellerName?: string;
  sellerLegalForm?: string;
  sellerCapital?: string;
  sellerTradeRegister?: string;
  sellerTaxId?: string;
  sellerAddress?: string;
  sellerPhone?: string;
  sellerEmail?: string;
}

@Component({
  selector: 'app-invoices',
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
    FormsModule,
    A11yModule,
    DialogShellComponent,
    ClientSelectorComponent,
    ErrorStateComponent,
    PageHeaderComponent,
    LoadingStateComponent,
    StatCardComponent,
    EmptyStateComponent,
    StatusBadgeComponent
  ],
  templateUrl: './invoices.html',
  styleUrl: './invoices.css'
})
export class InvoicesComponent implements OnInit {
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  loading = true;
  // QA 2026-09-18: double-click guard — duplicate invoices are money.
  creatingInvoice = false;
  loadError = false;
  invoices: Invoice[] = [];
  stats: any = {};
  processingId: string | null = null;
  
  statusFilter = '';
  typeFilter = '';
  showAddDialog = false;
  
  lineItems: LineItem[] = [];
  selectedClient: ClientSelection | null = null;

  newInvoice: Partial<Invoice> = {
    type: 'Sale',
    status: 'Draft',
    currency: 'USD',
    clientName: '',
    subtotal: 0,
    taxRate: 11,
    discount: 0,
    paymentTerms: 'Net 30'
  };

  statusOptions = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'];
  typeOptions = ['Sale', 'Rental', 'Commission', 'Management Fee', 'Other'];
  currencyOptions = ['USD', 'LBP'];
  taxRateOptions = [
    { label: '0% - Exempt', value: 0 },
    { label: '11% - Standard Rate', value: 11 },
    { label: 'No VAT', value: 0 }
  ];

  ngOnInit() {
    this.loadInvoices();
    this.loadStats();
  }

  loadInvoices() {
    this.loading = true;
    this.loadError = false;
    const filters: any = {};
    if (this.statusFilter) filters.status = this.statusFilter;
    if (this.typeFilter) filters.type = this.typeFilter;

    this.api.getInvoices(filters).subscribe({
      next: (res) => {
        this.invoices = Array.isArray(res) ? res : res.data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to fetch invoices', err);
        this.invoices = [];
        this.loading = false;
        this.loadError = true;
      }
    });
  }

  loadStats() {
    this.api.getInvoiceStats().subscribe({
      next: (res) => {
        this.stats = res || {};
      },
      error: (err) => {
        console.error('Failed to fetch stats', err);
      }
    });
  }

  addLineItem() {
    this.lineItems.push({
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    });
  }

  removeLineItem(index: number) {
    this.lineItems.splice(index, 1);
    this.calculateSubtotal();
  }

  updateLineItemTotal(item: LineItem) {
    // QA 2026-09-18: clamp money inputs (negative/NaN qty×price previously
    // POSTed straight through to negative invoice totals).
    if (!Number.isFinite(item.quantity) || item.quantity < 1) item.quantity = 1;
    if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) item.unitPrice = 0;
    item.total = item.quantity * item.unitPrice;
    this.calculateSubtotal();
  }

  calculateSubtotal() {
    this.newInvoice.subtotal = this.lineItems.reduce((sum, item) => sum + (item.total || 0), 0);
  }

  onClientSelected(selection: ClientSelection): void {
    this.selectedClient = selection;
    if (selection.client) {
      this.newInvoice.clientName = selection.client.name;
      this.newInvoice.clientEmail = selection.client.email;
      this.newInvoice.clientPhone = selection.client.phone;
    }
  }

  createInvoice() {
    if (this.creatingInvoice) return;
    if (!this.newInvoice.clientName) {
      this.snackBar.open('Client name is required', 'Close', { duration: 3000 });
      return;
    }

    if (this.lineItems.length === 0) {
      this.snackBar.open('Please add at least one line item', 'Close', { duration: 3000 });
      return;
    }

    // QA 2026-09-18: never POST negative/NaN money (devtools-bypassable HTML mins).
    for (const item of this.lineItems) {
      this.updateLineItemTotal(item);
      if (!item.description?.trim()) {
        this.snackBar.open('Each line item needs a description', 'Close', { duration: 3000 });
        return;
      }
    }
    if (!Number.isFinite(this.newInvoice.discount) || (this.newInvoice.discount ?? 0) < 0) {
      this.snackBar.open('Discount cannot be negative', 'Close', { duration: 3000 });
      return;
    }

    const invoiceData: any = {
      ...this.newInvoice,
      leadId: this.selectedClient?.leadId || null,
      lineItems: this.lineItems,
      issueDate: new Date(),
      // QA 2026-09-18: dueDate follows paymentTerms (was hardcoded +30d).
      dueDate: this.dueDateForTerms(this.newInvoice.paymentTerms)
    };

    this.creatingInvoice = true;
    this.api.createInvoice(invoiceData).subscribe({
      next: (res) => {
        this.invoices.unshift((res as any)?.data ?? res);
        this.showAddDialog = false;
        this.resetForm();
        this.loadStats();
        this.snackBar.open('Invoice created successfully', 'Close', { duration: 3000 });
        this.creatingInvoice = false;
      },
      error: (err) => {
        this.snackBar.open('Failed to create invoice: ' + (err.error?.message || 'Unknown error'), 'Close', { duration: 3000 });
        this.creatingInvoice = false;
      }
    });
  }

  private dueDateForTerms(terms?: string): Date {
    const days: Record<string, number> = {
      'Due on Receipt': 0,
      'Net 15': 15,
      'Net 30': 30,
      'Net 60': 60
    };
    const d = days[terms || 'Net 30'] ?? 30;
    return new Date(Date.now() + d * 24 * 60 * 60 * 1000);
  }

  markAsPaid(invoice: Invoice) {
    this.processingId = invoice.id;
    this.api.markInvoiceAsPaid(invoice.id).subscribe({
      next: (res: any) => {
        const index = this.invoices.findIndex(i => i.id === invoice.id);
        if (index > -1) {
          this.invoices[index] = { ...this.invoices[index], ...res };
        }
        this.loadStats();
        this.snackBar.open('Invoice marked as paid', 'Close', { duration: 2000 });
        this.processingId = null;
      },
      error: (err) => {
        this.snackBar.open('Failed to update invoice', 'Close', { duration: 3000 });
        this.processingId = null;
      }
    });
  }

  deleteInvoice(invoice: Invoice) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      maxWidth: '95vw',
      data: {
        title: 'Delete invoice?',
        message: `Invoice ${invoice.invoiceNumber} will be permanently deleted. This cannot be undone.`,
        confirmLabel: 'Delete',
        destructive: true
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.processingId = invoice.id;
      this.api.deleteInvoice(invoice.id).subscribe({
        next: () => {
          this.invoices = this.invoices.filter(i => i.id !== invoice.id);
          this.loadStats();
          this.snackBar.open('Invoice deleted', 'Close', { duration: 2000 });
          this.processingId = null;
        },
        error: (err) => {
          this.snackBar.open('Failed to delete invoice', 'Close', { duration: 3000 });
          this.processingId = null;
        }
      });
    });
  }

  isProcessing(id: string): boolean {
    return this.processingId === id;
  }

  formatCurrency(value: number): string {
    return formatMoneyUSD(value);
  }

  formatCurrencyWithSymbol(value: number, currency: string = 'USD'): string {
    // QA 2026-09-18: never render NaN/$NaN (one bad row poisoned totals).
    return formatMoney(value, currency);
  }

  formatDate(date: string): string {
    return formatDateMed(date);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Paid': return 'status-paid';
      case 'Sent': return 'status-sent';
      case 'Overdue': return 'status-overdue';
      case 'Draft': return 'status-draft';
      case 'Cancelled': return 'status-cancelled';
      default: return '';
    }
  }

  getTotalPaid(): number {
    return this.stats.totalPaid || 0;
  }

  getTotalOutstanding(): number {
    return this.stats.totalOutstanding || 0;
  }

  resetForm() {
    this.newInvoice = {
      type: 'Sale',
      status: 'Draft',
      currency: 'USD',
      clientName: '',
      subtotal: 0,
      taxRate: 11,
      discount: 0,
      paymentTerms: 'Net 30'
    };
    this.lineItems = [];
    this.selectedClient = null;
  }

  closeDialog() {
    this.showAddDialog = false;
    this.resetForm();
  }
}
