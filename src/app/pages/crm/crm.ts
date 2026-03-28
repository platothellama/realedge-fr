import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ApiService } from '../../services/api';
import { LeadFormComponent } from '../../components/lead-form/lead-form';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTabsModule } from '@angular/material/tabs';
import { PropertySearchComponent, SearchFilters, SearchFilterConfig } from '../../components/property-search/property-search';

@Component({
  selector: 'app-crm',
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
    MatTooltipModule,
    MatExpansionModule,
    MatStepperModule,
    MatTabsModule,
    PropertySearchComponent
  ],
  templateUrl: './crm.html',
  styleUrl: './crm.css',
})
export class CrmComponent implements OnInit {
  allLeads: any[] = [];
  searchQuery: string = '';
  selectedStatus: string = 'All';
  deletingId: string | null = null;
  expandedLeadId: string | null = null;

  statuses = ['All', 'New Lead', 'Contacted', 'Visit Scheduled', 'Negotiation', 'Closed Deal', 'Lost Lead'];

  searchFilters: SearchFilters = {
    searchQuery: '',
    selectedStatus: 'All',
    selectedType: 'All',
    selectedCity: 'All',
    minBedrooms: null,
    maxBedrooms: null,
    minBathrooms: null,
    minPrice: null,
    maxPrice: null,
    minArea: null,
    maxArea: null
  };

  searchConfig: SearchFilterConfig = {
    showSearch: true,
    showStatus: true,
    showType: false,
    showCity: false,
    showBedrooms: false,
    showBathrooms: false,
    showPrice: false,
    showArea: false
  };

  pipeline: any[] = [
    { name: 'New Lead', status: 'New Lead', leads: [] },
    { name: 'Contacted', status: 'Contacted', leads: [] },
    { name: 'Visit Scheduled', status: 'Visit Scheduled', leads: [] },
    { name: 'Negotiation', status: 'Negotiation', leads: [] },
    { name: 'Closed Deal', status: 'Closed Deal', leads: [] },
    { name: 'Lost Lead', status: 'Lost Lead', leads: [] }
  ];

  constructor(
    private apiService: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.fetchLeads();
  }

  fetchLeads() {
    this.apiService.getLeads().subscribe({
      next: (data: any) => {
        this.allLeads = Array.isArray(data) ? data : (data?.data || []);
        this.applyFilters();
      },
      error: (err) => {
        console.error('Failed to fetch leads', err);
        this.showError('Failed to load leads');
        this.allLeads = [];
      }
    });
  }

  applyFilters() {
    let filtered = [...this.allLeads];

    if (this.searchFilters.searchQuery) {
      const q = this.searchFilters.searchQuery.toLowerCase();
      filtered = filtered.filter(l =>
        l.name?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.phone?.toLowerCase().includes(q)
      );
    }

    if (this.searchFilters.selectedStatus !== 'All') {
      filtered = filtered.filter(l => l.status === this.searchFilters.selectedStatus);
    }

    this.mapLeadsToPipeline(filtered);
  }

  onFiltersChange(filters: SearchFilters) {
    this.searchFilters = filters;
    this.applyFilters();
  }

  get filteredLeads(): any[] {
    let filtered = [...this.allLeads];

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(l =>
        l.name?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.phone?.toLowerCase().includes(q)
      );
    }

    if (this.selectedStatus !== 'All') {
      filtered = filtered.filter(l => l.status === this.selectedStatus);
    }

    return filtered;
  }

  toggleExpand(leadId: string) {
    this.expandedLeadId = this.expandedLeadId === leadId ? null : leadId;
  }

  getScheduledVisits(lead: any): any[] {
    return (lead.visits || []).filter((v: any) => v.status === 'Scheduled');
  }

  getCompletedVisits(lead: any): any[] {
    return (lead.visits || []).filter((v: any) => v.status === 'Completed');
  }

  getAllVisits(lead: any): any[] {
    return lead.visits || [];
  }

  private mapLeadsToPipeline(leads: any[]) {
    this.pipeline.forEach(stage => stage.leads = []);
    leads.forEach(lead => {
      const stage = this.pipeline.find(s => s.status === lead.status);
      if (stage) stage.leads.push(lead);
      else this.pipeline[0].leads.push(lead);
    });
  }

  exportToCSV() {
    if (this.allLeads.length === 0) {
      this.snackBar.open('No leads to export', 'Close', { duration: 3000 });
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Source', 'Status', 'Budget', 'Nationality', 'Preferred Areas', 'Created At'];
    const csvData = this.allLeads.map(l => [
      l.name,
      l.email,
      l.phone,
      l.source,
      l.status,
      l.budget,
      l.nationality,
      `"${l.preferredAreas || ''}"`,
      new Date(l.createdAt).toLocaleDateString()
    ].join(','));

    const csvContent = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  triggerImport() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv';
    fileInput.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) this.importLeads(file);
    };
    fileInput.click();
  }

  private importLeads(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const text = e.target.result;
      const lines = text.split('\n');
      const leads = [];

      // Basic CSV parsing (skip header)
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (cols.length >= 3) {
          leads.push({
            name: cols[0]?.trim(),
            email: cols[1]?.trim(),
            phone: cols[2]?.trim(),
            source: cols[3]?.trim() || 'Website',
            status: cols[4]?.trim() || 'New Lead',
            budget: parseFloat(cols[5]) || 0
          });
        }
      }

      if (leads.length === 0) {
        this.showError('No valid leads found in CSV');
        return;
      }

      // We'll create leads one by one for simplicity in this demo,
      // or implement a bulk create endpoint on the backend
      let count = 0;
      leads.forEach(lead => {
        this.apiService.createLead(lead).subscribe({
          next: () => {
            count++;
            if (count === leads.length) {
              this.fetchLeads();
              this.snackBar.open(`Successfully imported ${count} leads`, 'Close', { duration: 3000 });
            }
          },
          error: (err) => console.error('Failed to import a lead', err)
        });
      });
    };
    reader.readAsText(file);
  }

  drop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const lead = event.previousContainer.data[event.previousIndex];
      const newStatus = event.container.id; // We'll set the container id to the status name

      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Update lead status in backend
      this.updateLeadStatus(lead.id, newStatus);
    }
  }

  updateLeadStatus(id: string, status: string) {
    this.apiService.updateLead(id, { status }).subscribe({
      next: () => {
        this.snackBar.open(`Status updated to ${status}`, 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error updating status', err);
        this.showError('Failed to update status');
        this.fetchLeads(); // Refresh to original state on error
      }
    });
  }

  openLeadForm(lead?: any) {
    const dialogRef = this.dialog.open(LeadFormComponent, {
      width: '850px',
      maxWidth: '95vw',
      data: { lead }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (lead && lead.id) {
          this.updateLead(lead.id, result);
        } else {
          this.createLead(result);
        }
      }
    });
  }

  createLead(data: any) {
    this.apiService.createLead(data).subscribe({
      next: () => {
        this.fetchLeads();
        this.snackBar.open('Lead created successfully', 'Close', { duration: 3000 });
      },
      error: (err) => this.showError('Error creating lead')
    });
  }

  updateLead(id: string, data: any) {
    this.apiService.updateLead(id, data).subscribe({
      next: () => {
        this.fetchLeads();
        this.snackBar.open('Lead updated successfully', 'Close', { duration: 3000 });
      },
      error: (err) => this.showError('Error updating lead')
    });
  }

  deleteLead(id: string) {
    if (confirm('Are you sure you want to delete this lead?')) {
      this.deletingId = id;
      this.apiService.deleteLead(id).subscribe({
        next: () => {
          this.fetchLeads();
          this.snackBar.open('Lead deleted', 'Close', { duration: 3000 });
          this.deletingId = null;
        },
        error: (err) => {
          this.showError('Error deleting lead');
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

  scheduleVisit(lead: any) {
    // This would open the visit form dialog
    // For now, we'll just show a message
    this.snackBar.open('Schedule visit for ' + lead.name, 'Close', { duration: 3000 });
  }

  convertToDeal(lead: any) {
    if (!lead.interestedIn) {
      this.snackBar.open('No property specified for this lead. Please add a property first.', 'Close', { duration: 5000 });
      return;
    }

    const propertyId = lead.interestedIn;
    const sellerName = 'Seller'; 

    this.apiService.convertLeadToDeal(lead.id, { propertyId, sellerName }).subscribe({
      next: (response) => {
        this.fetchLeads();
        this.snackBar.open('Lead converted to deal!', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error converting lead', err);
        this.showError('Failed to convert lead to deal');
      }
    });
  }
}
