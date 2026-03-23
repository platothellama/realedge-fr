import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ApiService } from '../../services/api';
import { DealFormComponent } from '../../components/deal-form/deal-form';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-deals',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    CommonModule,
    MatDialogModule,
    DragDropModule,
    MatSnackBarModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatTabsModule
  ],
  templateUrl: './deals.html',
  styleUrl: './deals.css',
})
export class DealsComponent implements OnInit {
  allDeals: any[] = [];
  searchQuery: string = '';
  selectedStage: string = 'All';
  deletingId: string | null = null;

  pipeline: any[] = [
    { name: 'Negotiation', status: 'Negotiation', deals: [] },
    { name: 'Reserved', status: 'Reserved', deals: [] },
    { name: 'Contract Signed', status: 'Contract Signed', deals: [] },
    { name: 'Payment', status: 'Payment', deals: [] },
    { name: 'Closed', status: 'Closed', deals: [] }
  ];

  constructor(
    private apiService: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.fetchDeals();
  }

  fetchDeals() {
    this.apiService.getDeals().subscribe({
      next: (data: any) => {
        this.allDeals = Array.isArray(data) ? data : (data?.data || []);
        this.applyFilters();
      },
      error: (err) => {
        console.error('Failed to fetch deals', err);
        this.showError('Failed to load deals');
        this.allDeals = [];
      }
    });
  }

  applyFilters() {
    let filtered = [...this.allDeals];

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        d.title?.toLowerCase().includes(q) ||
        d.buyerName?.toLowerCase().includes(q) ||
        d.sellerName?.toLowerCase().includes(q) ||
        d.property?.title?.toLowerCase().includes(q)
      );
    }

    if (this.selectedStage !== 'All') {
      filtered = filtered.filter(d => d.dealStage === this.selectedStage);
    }

    this.mapDealsToPipeline(filtered);
  }

  exportDealsToCSV() {
    if (this.allDeals.length === 0) {
      this.snackBar.open('No deals to export', 'Close', { duration: 3000 });
      return;
    }

    const headers = ['Title', 'Buyer', 'Seller', 'Property', 'Commission', 'Stage', 'Broker', 'Created At'];
    const csvData = this.allDeals.map(d => [
      `"${d.title || ''}"`,
      `"${d.buyerName || ''}"`,
      `"${d.sellerName || ''}"`,
      `"${d.property?.title || ''}"`,
      d.commission,
      d.dealStage,
      `"${d.broker?.name || ''}"`,
      new Date(d.createdAt).toLocaleDateString()
    ].join(','));

    const csvContent = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `deals_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private mapDealsToPipeline(deals: any[]) {
    this.pipeline.forEach(stage => stage.deals = []);
    deals.forEach(deal => {
      const stage = this.pipeline.find(s => s.status === deal.dealStage);
      if (stage) stage.deals.push(deal);
      else this.pipeline[0].deals.push(deal);
    });
  }

  drop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const deal = event.previousContainer.data[event.previousIndex];
      const newStage = event.container.id;

      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      this.updateDealStage(deal.id, newStage);
    }
  }

  updateDealStage(id: string, dealStage: string) {
    this.apiService.updateDeal(id, { dealStage }).subscribe({
      next: () => {
        let msg = `Deal moved to ${dealStage}`;
        if (dealStage === 'Reserved') {
          msg += ' - Property is now reserved';
        }
        this.snackBar.open(msg, 'Close', { duration: 3000 });
        this.fetchDeals();
      },
      error: (err) => {
        console.error('Error updating stage', err);
        this.showError('Failed to update stage');
        this.fetchDeals();
      }
    });
  }

  openDealForm(deal?: any) {
    const dialogRef = this.dialog.open(DealFormComponent, {
      width: '850px',
      maxWidth: '95vw',
      data: { deal }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (deal && deal.id) {
          this.updateDeal(deal.id, result);
        } else {
          this.createDeal(result);
        }
      }
    });
  }

  createDeal(data: any) {
    this.apiService.createDeal(data).subscribe({
      next: () => {
        this.fetchDeals();
        this.snackBar.open('Deal created successfully', 'Close', { duration: 3000 });
      },
      error: (err) => this.showError('Error creating deal')
    });
  }

  updateDeal(id: string, data: any) {
    this.apiService.updateDeal(id, data).subscribe({
      next: () => {
        this.fetchDeals();
        this.snackBar.open('Deal updated successfully', 'Close', { duration: 3000 });
      },
      error: (err) => this.showError('Error updating deal')
    });
  }

  deleteDeal(id: string) {
    if (confirm('Are you sure you want to delete this deal?')) {
      this.deletingId = id;
      this.apiService.deleteDeal(id).subscribe({
        next: () => {
          this.fetchDeals();
          this.snackBar.open('Deal deleted', 'Close', { duration: 3000 });
          this.deletingId = null;
        },
        error: (err) => {
          this.showError('Error deleting deal');
          this.deletingId = null;
        }
      });
    }
  }

  isDeleting(id: string): boolean {
    return this.deletingId === id;
  }

  private showError(msg: string) {
    this.snackBar.open(msg, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
  }
}
