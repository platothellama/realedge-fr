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
import { ApiService } from '../../services/api';
import { ClientSelectorComponent, ClientSelection } from '../../components/client-selector/client-selector';

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
    ClientSelectorComponent
  ],
  templateUrl: './invoices.html',
  styleUrl: './invoices.css'
})
export class InvoicesComponent implements OnInit {
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  loading = true;
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
    if (!this.newInvoice.clientName) {
      this.snackBar.open('Client name is required', 'Close', { duration: 3000 });
      return;
    }

    if (this.lineItems.length === 0) {
      this.snackBar.open('Please add at least one line item', 'Close', { duration: 3000 });
      return;
    }

    const invoiceData: any = {
      ...this.newInvoice,
      leadId: this.selectedClient?.leadId || null,
      lineItems: this.lineItems,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };

    this.api.createInvoice(invoiceData).subscribe({
      next: (res) => {
        this.invoices.unshift(res);
        this.showAddDialog = false;
        this.resetForm();
        this.loadStats();
        this.snackBar.open('Invoice created successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open('Failed to create invoice: ' + (err.error?.message || 'Unknown error'), 'Close', { duration: 3000 });
      }
    });
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
  }

  isProcessing(id: string): boolean {
    return this.processingId === id;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  }

  formatCurrencyWithSymbol(value: number, currency: string = 'USD'): string {
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
