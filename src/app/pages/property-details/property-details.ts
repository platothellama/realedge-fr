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
import { LeadWorkflowComponent, LeadWorkflowResult } from '../../components/lead-workflow/lead-workflow';
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
    DocumentManagerComponent,
  ],
  templateUrl: './property-details.html',
  styleUrl: './property-details.css'
})
export class PropertyDetailsComponent implements OnInit {
  property: any;
  loading = true;
  performanceCollapsed = true;
  lightboxOpen = false;
  lightboxIndex = 0;
  propertyVisits: any[] = [];
  propertyDeals: any[] = [];
  propertyLeads: any[] = [];

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
        this.property = {
          ...res,
          photos: Array.isArray(res.photos) ? res.photos : [],
          features: Array.isArray(res.features) ? res.features : [],
          priceHistoryEntries: Array.isArray(res.priceHistoryEntries) ? res.priceHistoryEntries : []
        };
        this.calculateAnalytics();
        this.loadPropertyRelatedData(id);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching property Details:', err);
        this.loading = false;
      }
    });
  }

  loadPropertyRelatedData(propertyId: string) {
    this.api.getVisits().subscribe({
      next: (res: any) => {
        const allVisits = Array.isArray(res) ? res : (res?.data || []);
        this.propertyVisits = allVisits.filter((v: any) => v.propertyId === propertyId);
      }
    });

    this.api.getDeals().subscribe({
      next: (res: any) => {
        const allDeals = Array.isArray(res) ? res : (res?.data || []);
        this.propertyDeals = allDeals.filter((d: any) => d.propertyId === propertyId);
      }
    });

    this.api.getLeads().subscribe({
      next: (res: any) => {
        const allLeads = Array.isArray(res) ? res : (res?.data || []);
        this.propertyLeads = allLeads.filter((l: any) => l.propertyId === propertyId);
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
      width: '550px',
      data: { propertyPrice: this.property.price }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.api.addNegotiation(this.property.id, result).subscribe({
          next: () => {
            this.snackBar.open('Negotiation log added successfully!', 'Close', { duration: 3000 });
            this.fetchProperty(this.property.id);
          },
          error: (err) => {
            console.error('Error adding negotiation', err);
            this.snackBar.open('Failed to add negotiation log', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  startDeal() {
    const dialogRef = this.dialog.open(DealFormComponent, {
      width: '850px',
      data: {
        propertyId: this.property.id,
        sellerId: this.property.sellerId || null,
        seller: this.property.seller || null,
        deal: {
          propertyId: this.property.id,
          title: `Sale of ${this.property.title}`,
          sellerId: this.property.sellerId || null,
          sellerName: this.property.seller?.name || ''
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

  openLeadWorkflow() {
    const dialogRef = this.dialog.open(LeadWorkflowComponent, {
      width: '700px',
      data: { propertyId: this.property.id, property: this.property }
    });

    dialogRef.afterClosed().subscribe((result: LeadWorkflowResult) => {
      if (result) {
        if (result.visit) {
          this.api.createVisit(result.visit).subscribe({
            next: () => {
              this.snackBar.open('Visit scheduled successfully!', 'View Calendar', { duration: 5000 })
                .onAction().subscribe(() => this.router.navigate(['/visits']));
            },
            error: (err) => console.error('Error scheduling visit', err)
          });
        }
        if (result.deal) {
          this.api.createDeal(result.deal).subscribe({
            next: () => {
              this.snackBar.open('Deal created successfully!', 'View Deals', { duration: 5000 })
                .onAction().subscribe(() => this.router.navigate(['/deals']));
            },
            error: (err) => console.error('Error creating deal', err)
          });
        }
      }
    });
  }

  goBack() {
    this.router.navigate(['/properties']);
  }

  openLightbox(index: number) {
    this.lightboxIndex = index;
    this.lightboxOpen = true;
  }

  closeLightbox() {
    this.lightboxOpen = false;
  }

  prevImage(event: Event) {
    event.stopPropagation();
    if (this.property?.photos?.length) {
      this.lightboxIndex = (this.lightboxIndex - 1 + this.property.photos.length) % this.property.photos.length;
    }
  }

  nextImage(event: Event) {
    event.stopPropagation();
    if (this.property?.photos?.length) {
      this.lightboxIndex = (this.lightboxIndex + 1) % this.property.photos.length;
    }
  }

  getValuationWidth(): number {
    if (!this.analytics?.valuationClass || this.analytics.valuationClass === 'unknown') return 50;
    if (this.analytics.valuationClass === 'undervalued') return 30;
    if (this.analytics.valuationClass === 'overvalued') return 80;
    return 50;
  }

  getValuationIcon(): string {
    if (this.analytics?.valuationClass === 'undervalued') return 'trending_down';
    if (this.analytics?.valuationClass === 'overvalued') return 'trending_up';
    return 'remove';
  }
}
