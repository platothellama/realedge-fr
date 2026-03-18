import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../services/api';
import { PropertyFormComponent } from '../../components/property-form/property-form';
import { NegotiationFormComponent } from '../../components/negotiation-form/negotiation-form';
import { DealFormComponent } from '../../components/deal-form/deal-form';
import { VisitFormComponent } from '../../components/visit-form/visit-form';
import { DocumentManagerComponent } from '../../components/document-manager/document-manager';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTabsModule,
    MatDividerModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    DocumentManagerComponent
  ],
  templateUrl: './property-details.html',
  styleUrl: './property-details.css'
})
export class PropertyDetailsComponent implements OnInit {
  property: any;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.fetchProperty(id);
    }
  }

  fetchProperty(id: string) {
    this.loading = true;
    this.api.getPropertyById(id).subscribe({
      next: (res) => {
        this.property = res;
        this.calculateAnalytics();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching property Details:', err);
        this.loading = false;
      }
    });
  }

  analytics: any = {};

  calculateAnalytics() {
    if (!this.property) return;

    const daysOnMarket = this.property.daysOnMarket || 0;
    const views = this.property.views || 0;
    const inquiries = this.property.inquiries || 0;
    const price = Number(this.property.price) || 0;
    const area = this.property.area || 1;
    const marketValue = Number(this.property.marketValue) || 0;

    this.analytics = {
      pricePerSqm: area > 0 ? price / area : 0,
      marketValue: marketValue,
      priceVsMarket: marketValue > 0 ? ((price - marketValue) / marketValue) * 100 : 0,
      daysOnMarket,
      views,
      inquiries,
      visitsPerView: views > 0 ? (inquiries / views * 100).toFixed(1) : 0,
      status: this.getPropertyStatus(daysOnMarket, views, inquiries, marketValue, price),
      daysClass: daysOnMarket > 60 ? 'stale' : daysOnMarket > 30 ? 'aging' : 'fresh',
      valuationClass: marketValue > 0 ? (price > marketValue * 1.1 ? 'overvalued' : price < marketValue * 0.9 ? 'undervalued' : 'fair') : 'unknown'
    };
  }

  getPropertyStatus(daysOnMarket: number, views: number, inquiries: number, marketValue: number, price: number): string {
    if (daysOnMarket > 60) return 'Stale Listing';
    if (views === 0) return 'No Views';
    if (inquiries === 0) return 'No Inquiries';
    if (marketValue > 0 && price > marketValue * 1.1) return 'Overvalued';
    if (marketValue > 0 && price < marketValue * 0.9) return 'Undervalued';
    return 'Active';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Active': return '#10b981';
      case 'Undervalued': return '#10b981';
      case 'Overvalued': return '#ef4444';
      case 'Stale Listing': return '#ef4444';
      case 'No Views': return '#f59e0b';
      case 'No Inquiries': return '#f59e0b';
      default: return '#64748b';
    }
  }

  openEditForm() {
    const dialogRef = this.dialog.open(PropertyFormComponent, {
      width: '850px',
      data: { property: this.property }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.api.updateProperty(this.property.id, result).subscribe({
          next: () => this.fetchProperty(this.property.id),
          error: (err) => console.error('Error updating property', err)
        });
      }
    });
  }

  openNegotiationForm() {
    const dialogRef = this.dialog.open(NegotiationFormComponent, {
      width: '500px',
      data: { propertyPrice: this.property.price }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.api.addNegotiation(this.property.id, result).subscribe({
          next: () => this.fetchProperty(this.property.id),
          error: (err) => console.error('Error adding negotiation', err)
        });
      }
    });
  }

  startDeal() {
    const dialogRef = this.dialog.open(DealFormComponent, {
      width: '850px',
      data: {
        deal: {
          propertyId: this.property.id,
          title: `Sale of ${this.property.title}`
        }
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.api.createDeal(result).subscribe({
          next: () => {
            this.snackBar.open('Deal started successfully!', 'View Deals', { duration: 5000 })
              .onAction().subscribe(() => this.router.navigate(['/deals']));
          },
          error: (err) => console.error('Error creating deal', err)
        });
      }
    });
  }

  scheduleVisit() {
    const dialogRef = this.dialog.open(VisitFormComponent, {
      width: '600px',
      data: { propertyId: this.property.id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.api.createVisit(result).subscribe({
          next: () => {
            this.snackBar.open('Visit scheduled successfully!', 'View Calendar', { duration: 5000 })
              .onAction().subscribe(() => this.router.navigate(['/visits']));
          },
          error: (err) => console.error('Error scheduling visit', err)
        });
      }
    });
  }

  goBack() {
    this.router.navigate(['/properties']);
  }
}
