import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { ApiService } from '../../services/api';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-lead-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatMenuModule,
    MatListModule,
    FormsModule
  ],
  templateUrl: './lead-details.html',
  styleUrl: './lead-details.css'
})
export class LeadDetailsComponent implements OnInit {
  lead: any = null;
  leadId: string = '';
  loading: boolean = true;
  selectedPropertyId: string | null = null;
  propertyVisits: any[] = [];
  allActivities: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.leadId = this.route.snapshot.paramMap.get('id') || '';
    if (this.leadId) {
      this.loadLead();
    } else {
      this.router.navigate(['/crm']);
    }
  }

  loadLead() {
    this.loading = true;
    this.apiService.getLeadById(this.leadId).subscribe({
      next: (data: any) => {
        this.lead = data;
        this.buildTimeline();
        if (this.lead.visits && this.lead.visits.length > 0) {
          this.selectProperty(this.lead.visits[0].propertyId);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading lead', err);
        this.snackBar.open('Failed to load lead', 'Close', { duration: 3000 });
        this.loading = false;
        this.router.navigate(['/crm']);
      }
    });
  }

  buildTimeline() {
    this.allActivities = [];
    
    if (this.lead.createdAt) {
      this.allActivities.push({
        type: 'created',
        icon: 'person_add',
        title: 'Lead Created',
        description: `Lead added from ${this.lead.source} source`,
        date: this.lead.createdAt,
        property: null
      });
    }

    if (this.lead.status !== 'New Lead' && this.lead.updatedAt) {
      this.allActivities.push({
        type: 'status',
        icon: 'swap_horiz',
        title: 'Status Changed',
        description: `Status updated to ${this.lead.status}`,
        date: this.lead.updatedAt,
        property: null
      });
    }

    if (this.lead.visits) {
      this.lead.visits.forEach((visit: any) => {
        this.allActivities.push({
          type: 'visit',
          icon: visit.status === 'Completed' ? 'check_circle' : 'event',
          title: visit.status === 'Completed' ? 'Visit Completed' : 'Visit Scheduled',
          description: visit.notes || `${visit.title}`,
          date: visit.visitDate,
          property: visit.property,
          visit: visit
        });
      });
    }

    if (this.lead.deals) {
      this.lead.deals.forEach((deal: any) => {
        this.allActivities.push({
          type: 'deal',
          icon: 'handshake',
          title: 'Deal Created',
          description: `Deal for ${deal.property?.title || 'property'}`,
          date: deal.createdAt,
          property: deal.property,
          deal: deal
        });
        
        if (deal.status === 'Closed') {
          this.allActivities.push({
            type: 'closed',
            icon: 'celebration',
            title: 'Deal Closed',
            description: `Sale completed - $${deal.price?.toLocaleString()}`,
            date: deal.closedAt || deal.updatedAt,
            property: deal.property,
            deal: deal
          });
        }
      });
    }

    if (this.lead.tasks) {
      this.lead.tasks.forEach((task: any) => {
        this.allActivities.push({
          type: 'task',
          icon: task.status === 'done' ? 'task_alt' : 'radio_button_unchecked',
          title: task.title,
          description: task.description || `Priority: ${task.priority}`,
          date: task.dueDate || task.createdAt,
          property: null,
          task: task
        });
      });
    }

    if (this.lead.notes) {
      this.allActivities.push({
        type: 'note',
        icon: 'note',
        title: 'Note Added',
        description: this.lead.notes,
        date: this.lead.updatedAt || this.lead.createdAt,
        property: null
      });
    }

    if (this.lead.emails) {
      this.lead.emails.forEach((email: any) => {
        this.allActivities.push({
          type: 'email',
          icon: 'email',
          title: 'Email Sent',
          description: email.subject || 'Email communication',
          date: email.sentAt || email.createdAt,
          property: null,
          email: email
        });
      });
    }

    if (this.lead.calls) {
      this.lead.calls.forEach((call: any) => {
        this.allActivities.push({
          type: 'call',
          icon: 'phone',
          title: call.type === 'incoming' ? 'Incoming Call' : 'Outgoing Call',
          description: call.notes || 'Phone communication',
          date: call.callDate || call.createdAt,
          property: null,
          call: call
        });
      });
    }

    const propertiesViewed = new Set<string>();
    if (this.lead.propertyViews) {
      this.lead.propertyViews.forEach((view: any) => {
        if (!propertiesViewed.has(view.propertyId)) {
          propertiesViewed.add(view.propertyId);
          this.allActivities.push({
            type: 'viewed',
            icon: 'visibility',
            title: 'Property Viewed',
            description: `Viewed ${view.property?.title || 'a property'}`,
            date: view.viewedAt || view.createdAt,
            property: view.property
          });
        }
      });
    }

    this.allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getUniqueProperties(): any[] {
    const props = new Map<string, any>();
    if (this.lead.visits) {
      this.lead.visits.forEach((v: any) => {
        if (v.propertyId && v.property) {
          props.set(v.propertyId, { ...v.property, visitId: v.id });
        }
      });
    }
    if (this.lead.deals) {
      this.lead.deals.forEach((d: any) => {
        if (d.propertyId && d.property) {
          props.set(d.propertyId, { ...d.property, dealId: d.id });
        }
      });
    }
    return Array.from(props.values());
  }

  getVisitsForProperty(propertyId: string): any[] {
    return (this.lead.visits || []).filter((v: any) => v.propertyId === propertyId);
  }

  getDealsForProperty(propertyId: string): any[] {
    return (this.lead.deals || []).filter((d: any) => d.propertyId === propertyId);
  }

  selectProperty(propertyId: string | null) {
    this.selectedPropertyId = propertyId;
    if (propertyId) {
      this.propertyVisits = this.getVisitsForProperty(propertyId);
    } else {
      this.propertyVisits = [];
    }
  }

  goBack() {
    this.router.navigate(['/crm']);
  }

  editLead() {
    // Navigate to edit or open edit dialog
    this.snackBar.open('Edit lead functionality', 'Close', { duration: 2000 });
  }

  convertToDeal() {
    if (!this.lead.interestedIn) {
      this.snackBar.open('No property specified for this lead', 'Close', { duration: 3000 });
      return;
    }
    this.apiService.convertLeadToDeal(this.lead.id, { propertyId: this.lead.interestedIn }).subscribe({
      next: () => {
        this.snackBar.open('Lead converted to deal!', 'Close', { duration: 3000 });
        this.loadLead();
      },
      error: (err) => {
        this.snackBar.open('Failed to convert lead', 'Close', { duration: 3000 });
      }
    });
  }

  deleteLead() {
    if (confirm('Are you sure you want to delete this lead?')) {
      this.apiService.deleteLead(this.lead.id).subscribe({
        next: () => {
          this.snackBar.open('Lead deleted', 'Close', { duration: 3000 });
          this.router.navigate(['/crm']);
        },
        error: () => {
          this.snackBar.open('Failed to delete lead', 'Close', { duration: 3000 });
        }
      });
    }
  }
}