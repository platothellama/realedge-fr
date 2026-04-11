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
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth/auth.service';
import { PropertyFormComponent } from '../../components/property-form/property-form';
import { NegotiationFormComponent } from '../../components/negotiation-form/negotiation-form';
import { DealFormComponent } from '../../components/deal-form/deal-form';
import { VisitFormComponent } from '../../components/visit-form/visit-form';
import { DocumentManagerComponent } from '../../components/document-manager/document-manager';
import { LeadWorkflowComponent, LeadWorkflowResult } from '../../components/lead-workflow/lead-workflow';
import { SoldDialogComponent } from '../../components/sold-dialog/sold-dialog';
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
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule,
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
  allLeads: any[] = [];
  analytics: any = {};
  currentUser: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private auth: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.currentUser = this.auth.currentUser();
  }

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
        this.fetchPropertyRelatedData(id);

        if (this.property.soldTo) {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(this.property.soldTo);
          if (isUuid) {
            this.resolveLeadName(this.property.soldTo, 'soldTo');
          }
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching property Details:', err);
        this.loading = false;
      }
    });
  }

  resolveLeadName(leadId: string, field: string) {
    this.api.getLeads().subscribe({
      next: (res: any) => {
        const allLeads = Array.isArray(res) ? res : (res?.data || []);
        const lead = allLeads.find((l: any) => l.id === leadId);
        if (lead) {
          this.property[field] = lead.name;
        }
      }
    });
  }

  fetchPropertyRelatedData(propertyId: string) {
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
      visitsPerView: views > 0 ? (inquiries / views * 100).toFixed(1) : '0',
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

  loadAllLeads() {
    this.api.getLeads().subscribe({
      next: (res: any) => {
        this.allLeads = Array.isArray(res) ? res : (res?.data || []);
      }
    });
  }

  showSoldDialog() {
    this.api.getLeads().subscribe({
      next: (res: any) => {
        this.allLeads = Array.isArray(res) ? res : (res?.data || []);

        const dialogRef = this.dialog.open(SoldDialogComponent, {
          width: '500px',
          data: {
            leads: this.allLeads,
            propertyId: this.property.id
          }
        });

        dialogRef.afterClosed().subscribe((result: any) => {
          if (result) {
            if (result.createNewDeal) {
              this.api.createDeal(result.newDeal).subscribe({
                next: (deal: any) => {
                  this.fetchProperty(this.property.id);
                },
                error: (err: any) => {
                  console.error('Error creating deal', err);
                  const errorMsg = err?.error?.message || 'Failed to create deal';
                  this.snackBar.open(errorMsg, 'Close', { duration: 5000 });
                }
              });
            } else if (result.dealId) {
              this.api.updateDeal(result.dealId, { dealStage: 'Closed' }).subscribe({
                next: () => {
                  this.fetchProperty(this.property.id);
                },
                error: (err: any) => {
                  console.error('Error updating deal', err);
                  this.snackBar.open('Failed to update deal', 'Close', { duration: 3000 });
                }
              });
            } else if (result.createNewLead) {
              this.api.createLead(result.newLead).subscribe({
                next: (lead: any) => {
                  this.markAsSold(lead.id || lead.name, result.soldAt);
                  this.fetchProperty(this.property.id);
                },
                error: (err: any) => {
                  console.error('Error creating lead', err);
                  this.snackBar.open('Failed to create lead', 'Close', { duration: 3000 });
                }
              });
            } else if (result.leadId) {
              this.markAsSold(result.leadName || result.leadId, result.soldAt);
              this.api.updateLead(result.leadId, {
                status: 'Closed',
                propertyId: this.property.id
              }).subscribe({
                next: () => this.fetchProperty(this.property.id),
                error: (err: any) => console.error('Error updating lead', err)
              });
            }
          }
        });
      },
      error: (err: any) => {
        console.error('Error loading leads', err);
        this.snackBar.open('Failed to load leads', 'Close', { duration: 3000 });
      }
    });
  }

  markAsSold(leadIdOrName: string, date: string) {
    this.api.updateProperty(this.property.id, {
      status: 'Sold',
      soldTo: leadIdOrName,
      soldAt: date || new Date().toISOString()
    }).subscribe({
      next: () => {
        this.snackBar.open('Property marked as sold!', 'Close', { duration: 3000 });
        this.fetchProperty(this.property.id);
      },
      error: (err: any) => {
        console.error('Error marking property as sold', err);
        this.snackBar.open('Failed to update property', 'Close', { duration: 3000 });
      }
    });
  }

  markAsLost(reason: string, date: string) {
    this.api.updateProperty(this.property.id, {
      status: 'Lost',
      lostTo: reason,
      lostAt: date || new Date().toISOString()
    }).subscribe({
      next: () => {
        this.snackBar.open('Property marked as lost', 'Close', { duration: 3000 });
        this.fetchProperty(this.property.id);
      },
      error: (err: any) => {
        console.error('Error marking property as lost', err);
        this.snackBar.open('Failed to update property', 'Close', { duration: 3000 });
      }
    });
  }

  reopenProperty() {
    this.api.updateProperty(this.property.id, {
      status: 'Available',
      soldTo: null,
      soldAt: null,
      lostTo: null,
      lostAt: null
    }).subscribe({
      next: () => {
        this.snackBar.open('Property reopened as available', 'Close', { duration: 3000 });
        this.fetchProperty(this.property.id);
      },
      error: (err: any) => {
        console.error('Error reopening property', err);
        this.snackBar.open('Failed to update property', 'Close', { duration: 3000 });
      }
    });
  }

  get canMarkSoldOrLost(): boolean {
    return this.property?.status === 'Available' || this.property?.status === 'Reserved';
  }

  get isSold(): boolean {
    return this.property?.status === 'Sold';
  }

  get isLost(): boolean {
    return this.property?.status === 'Lost';
  }

  showLostDialog() {
    const reason = prompt('Enter reason for losing (reason/competitor):', '');
    if (reason !== null && reason.trim()) {
      const date = prompt('Enter date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
      this.markAsLost(reason.trim(), date || '');
    }
  }

  getPrimaryPhotoIndex(): number {
    return this.property?.primaryPhotoIndex || 0;
  }

  getSecondaryPhotos(): string[] {
    const primaryIdx = this.getPrimaryPhotoIndex();
    const photos = this.property?.photos || [];
    if (photos.length <= 1) return [];
    const secondary = [...photos];
    secondary.splice(primaryIdx, 1);
    return secondary.slice(0, 4);
  }

  getSecondaryPhotoIndex(secondaryIdx: number): number {
    const primaryIdx = this.getPrimaryPhotoIndex();
    return (primaryIdx + secondaryIdx + 1) % (this.property?.photos?.length || 1);
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

  goBack() {
    this.router.navigate(['/properties']);
  }

  openLeadWorkflow() {
    const dialogRef = this.dialog.open(LeadWorkflowComponent, {
      width: '700px',
      maxHeight: '90vh',
      data: { propertyId: this.property.id, currentUser: this.currentUser }
    });

    dialogRef.afterClosed().subscribe((result: LeadWorkflowResult) => {
      if (result) {
        this.fetchPropertyRelatedData(this.property.id);
        this.snackBar.open('Workflow completed', 'Close', { duration: 3000 });
      }
    });
  }

  openEditForm() {
    const dialogRef = this.dialog.open(PropertyFormComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: { property: this.property, isEdit: true }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.api.updateProperty(this.property.id, result).subscribe({
          next: () => {
            this.fetchProperty(this.property.id);
            this.snackBar.open('Property updated successfully', 'Close', { duration: 3000 });
          },
          error: (err) => {
            console.error('Error updating property', err);
            this.snackBar.open('Failed to update property', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  openNegotiationForm() {
    this.api.getLeads().subscribe({
      next: (res: any) => {
        this.allLeads = Array.isArray(res) ? res : (res?.data || []);

        const dialogRef = this.dialog.open(NegotiationFormComponent, {
          width: '500px',
          data: {
            propertyId: this.property.id,
            leads: this.allLeads
          }
        });

        dialogRef.afterClosed().subscribe((result: any) => {
          if (result) {
            this.fetchProperty(this.property.id);
          }
        });
      },
      error: (err: any) => {
        console.error('Error loading leads', err);
        this.snackBar.open('Failed to load leads', 'Close', { duration: 3000 });
      }
    });
  }
}
