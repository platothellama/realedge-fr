import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-seller-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    FormsModule
  ],
  templateUrl: './seller-details.html',
  styleUrl: './seller-details.css'
})
export class SellerDetailsComponent implements OnInit {
  seller: any = null;
  stats: any = null;
  loading = true;
  sellerId: string = '';

  displayedColumns = ['title', 'price', 'status', 'type', 'city', 'actions'];
  dealColumns = ['title', 'property', 'agent', 'stage', 'commission', 'closedAt'];
  invoiceColumns = ['invoiceNumber', 'type', 'total', 'status', 'issueDate', 'dueDate'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.sellerId = this.route.snapshot.paramMap.get('id') || '';
    if (this.sellerId) {
      this.loadSeller();
    }
  }

  loadSeller() {
    this.loading = true;
    this.api.getSeller(this.sellerId).subscribe({
      next: (res: any) => {
        this.seller = res;
        this.loadStats();
      },
      error: (err) => {
        console.error('Error loading seller', err);
        this.showError('Failed to load seller details');
        this.loading = false;
      }
    });
  }

  loadStats() {
    this.api.getSellerStats(this.sellerId).subscribe({
      next: (res: any) => {
        this.stats = res;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading stats', err);
        this.loading = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/sellers']);
  }

  openPropertyDetails(property: any) {
    this.router.navigate(['/properties', property.id]);
  }

  openDealDetails(deal: any) {
    this.router.navigate(['/deals', deal.id]);
  }

  openInvoiceDetails(invoice: any) {
    this.router.navigate(['/invoices', invoice.id]);
  }

  getStatusClass(status: string): string {
    if (!status) return '';
    return status.toLowerCase().replace(/\s+/g, '-');
  }

  getStageClass(stage: string): string {
    if (!stage) return '';
    return stage.toLowerCase().replace(/\s+/g, '-');
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  showError(msg: string) {
    this.snackBar.open(msg, 'Close', { duration: 3000 });
  }

  editSeller() {
    const dialogRef = this.dialog.open(SellerFormDialogComponent, {
      width: '500px',
      data: { seller: this.seller }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.api.updateSeller(this.sellerId, result).subscribe({
          next: () => {
            this.snackBar.open('Seller updated successfully', 'Close', { duration: 3000 });
            this.loadSeller();
          },
          error: (err) => {
            console.error('Error updating seller', err);
            this.showError('Failed to update seller');
          }
        });
      }
    });
  }
}

@Component({
  selector: 'seller-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule
  ],
  template: `
    <h2 mat-dialog-title>Edit Seller</h2>
    <mat-dialog-content>
      <div class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput [(ngModel)]="formData.name" required>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput type="email" [(ngModel)]="formData.email">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Phone</mat-label>
          <input matInput [(ngModel)]="formData.phone">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Address</mat-label>
          <input matInput [(ngModel)]="formData.address">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>City</mat-label>
          <input matInput [(ngModel)]="formData.city">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Country</mat-label>
          <input matInput [(ngModel)]="formData.country">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput [(ngModel)]="formData.notes" rows="3"></textarea>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="!formData.name">Save</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .full-width { grid-column: 1 / -1; }
    mat-form-field { width: 100%; }
  `]
})
export class SellerFormDialogComponent {
  formData: any = {};

  constructor(
    public dialogRef: MatDialogRef<SellerFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data?.seller) {
      this.formData = { ...data.seller };
    }
  }

  save() {
    this.dialogRef.close(this.formData);
  }
}
