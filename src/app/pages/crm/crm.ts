import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ApiService } from '../../services/api';
import { LeadFormComponent } from '../../shared/organisms/lead-form/lead-form';
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
import { SearchFilters, SearchFilterConfig } from '../../shared/molecules/property-search/property-search';
import { ConfirmDialogComponent } from '../../shared/molecules/confirm-dialog/confirm-dialog';
import { escapeCsvCell as sharedEscapeCsvCell } from '../../shared/utils/format';
import { PageHeaderComponent } from '../../shared/molecules/page-header/page-header';
import { EmptyStateComponent } from '../../shared/atoms/empty-state/empty-state';
import { StatusBadgeComponent } from '../../shared/atoms/status-badge/status-badge';

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
    PageHeaderComponent,
    EmptyStateComponent,
    StatusBadgeComponent
  ],
  templateUrl: './crm.html',
  styleUrl: './crm.css',
})
export class CrmComponent implements OnInit {
  allLeads: any[] = [];
  searchQuery: string = '';
  selectedStatus: string = 'All';
  selectedSource: string = 'All';
  deletingId: string | null = null;
  // QA 2026-09-18: convert guard (duplicate deals on double-click).
  convertingId: string | null = null;
  expandedLeadId: string | null = null;

  statuses = ['All', 'New Lead', 'Contacted', 'Visit Scheduled', 'Negotiation', 'Closed Deal', 'Lost Lead'];

  searchFilters: SearchFilters = {
    searchQuery: '',
    selectedStatus: 'All',
    selectedType: 'All',
    selectedListingType: 'All',
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
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit() {
    this.fetchLeads();
  }

  openLeadDetails(leadId: string) {
    this.router.navigate(['/leads', leadId]);
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

    if (this.selectedSource !== 'All') {
      filtered = filtered.filter(l => l.source === this.selectedSource);
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

  getLeadTimeline(lead: any): any[] {
    const timeline: any[] = [];
    
    timeline.push({
      type: 'created',
      icon: 'person_add',
      title: 'Lead Created',
      description: `Lead added from ${lead.source} source`,
      date: lead.createdAt
    });

    if (lead.status !== 'New Lead') {
      timeline.push({
        type: 'status',
        icon: 'swap_horiz',
        title: 'Status Changed',
        description: `Status updated to ${lead.status}`,
        date: lead.updatedAt || lead.createdAt
      });
    }

    const visits = lead.visits || [];
    visits.forEach((visit: any) => {
      timeline.push({
        type: 'visit',
        icon: visit.status === 'Completed' ? 'check_circle' : 'event',
        title: visit.status === 'Completed' ? 'Visit Completed' : 'Visit Scheduled',
        description: visit.property ? `${visit.property.title} - ${visit.property.address}` : visit.title,
        date: visit.visitDate
      });
    });

    if (lead.deals && lead.deals.length > 0) {
      lead.deals.forEach((deal: any) => {
        timeline.push({
          type: 'deal',
          icon: 'handshake',
          title: 'Deal Created',
          description: `Deal for ${deal.property?.title || 'property'}`,
          date: deal.createdAt
        });
        
        if (deal.status === 'Closed') {
          timeline.push({
            type: 'closed',
            icon: 'celebration',
            title: 'Deal Closed',
            description: `Sale completed`,
            date: deal.closedAt || deal.updatedAt
          });
        }
      });
    }

    if (lead.tasks && lead.tasks.length > 0) {
      lead.tasks.forEach((task: any) => {
        timeline.push({
          type: 'task',
          icon: task.status === 'done' ? 'task_alt' : 'radio_button_unchecked',
          title: task.title,
          description: task.description || `Priority: ${task.priority}`,
          date: task.dueDate || task.createdAt
        });
      });
    }

    if (lead.notes) {
      timeline.push({
        type: 'note',
        icon: 'note',
        title: 'Note Added',
        description: lead.notes,
        date: lead.updatedAt || lead.createdAt
      });
    }

    return timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  private mapLeadsToPipeline(leads: any[]) {
    this.pipeline.forEach(stage => stage.leads = []);
    leads.forEach(lead => {
      const stage = this.pipeline.find(s => s.status === lead.status);
      if (stage) stage.leads.push(lead);
      else this.pipeline[0].leads.push(lead);
    });
  }

  /** Delegates to shared utils: RFC4180 escaping + formula-injection guard (QA 2026-09-18). */
  private escapeCsvCell(value: unknown): string {
    return sharedEscapeCsvCell(value);
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
      l.preferredAreas || '',
      new Date(l.createdAt).toLocaleDateString()
    ].map(c => this.escapeCsvCell(c)).join(','));

    const csvContent = [headers.map(h => this.escapeCsvCell(h)).join(','), ...csvData].join('\r\n');
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

  /** QA 2026-09-18: quote-aware row splitter (naive split(',') broke on
   * quoted commas) + per-row validation + bounded import size + honest
   * completion reporting (previously partial failures were silent). */
  private splitCsvRow(line: string): string[] {
    const cols: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') { cur += '"'; i++; }
          else inQuotes = false;
        } else cur += ch;
      } else if (ch === '"') inQuotes = true;
      else if (ch === ',') { cols.push(cur); cur = ''; }
      else cur += ch;
    }
    cols.push(cur);
    return cols;
  }

  private importLeads(file: File) {
    const MAX_IMPORT_ROWS = 500;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const text = e.target.result;
      const lines = text.split(/\r?\n/);
      const leads = [];
      let skipped = 0;

      // Skip header; ignore blank lines; bound the batch; parse quote-aware.
      const dataLines = lines.slice(1).filter((l: string) => l.trim());
      if (dataLines.length > MAX_IMPORT_ROWS) skipped = dataLines.length - MAX_IMPORT_ROWS;
      for (const line of dataLines.slice(0, MAX_IMPORT_ROWS)) {
        const cols = this.splitCsvRow(line);
        if (cols.length < 3) { skipped++; continue; }
        const email = cols[1]?.trim() || '';
        // Reject rows without a plausible name+email instead of creating junk.
        if (!cols[0]?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { skipped++; continue; }
        leads.push({
          name: cols[0]?.trim(),
          email,
          phone: cols[2]?.trim(),
          source: cols[3]?.trim() || 'Website',
          status: cols[4]?.trim() || 'New Lead',
          budget: parseFloat(cols[5]) || 0
        });
      }

      if (leads.length === 0) {
        this.showError('No valid leads found in CSV');
        return;
      }

      // QA 2026-09-18: one validated server call (was N parallel creates).
      this.apiService.bulkCreateLeads(leads).subscribe({
        next: (res: any) => {
          this.fetchLeads();
          const created = res?.created ?? leads.length;
          const skippedTotal = skipped + (res?.skipped ?? 0);
          this.snackBar.open(
            `Imported ${created} of ${leads.length} leads${skippedTotal ? ` (${skippedTotal} rows skipped)` : ''}`,
            'Close', { duration: 4000 });
        },
        error: (err) => {
          console.error('Failed to import leads', err);
          this.showError(err?.error?.message || 'Failed to import leads');
        }
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
    const lead = this.allLeads.find(l => l.id === id);
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      maxWidth: '95vw',
      data: {
        title: 'Delete lead?',
        message: `${lead?.name || 'This lead'} will be permanently deleted. This cannot be undone.`,
        confirmLabel: 'Delete',
        destructive: true
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
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
    });
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
    if (this.convertingId) return;
    if (!lead.interestedIn) {
      this.snackBar.open('No property specified for this lead. Please add a property first.', 'Close', { duration: 5000 });
      return;
    }

    const propertyId = lead.interestedIn;
    const sellerName = 'Seller'; 

    this.convertingId = lead.id;
    this.apiService.convertLeadToDeal(lead.id, { propertyId, sellerName }).subscribe({
      next: (response) => {
        this.fetchLeads();
        this.snackBar.open('Lead converted to deal!', 'Close', { duration: 3000 });
        this.convertingId = null;
      },
      error: (err) => {
        console.error('Error converting lead', err);
        this.showError(err?.error?.message || 'Failed to convert lead to deal');
        this.convertingId = null;
      }
    });
  }
}
