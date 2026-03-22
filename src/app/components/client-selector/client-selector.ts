import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

export interface ClientSelection {
  leadId: string | null;
  createNew: boolean;
  client: {
    name: string;
    email: string;
    phone: string;
  };
}

@Component({
  selector: 'app-client-selector',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './client-selector.html',
  styleUrl: './client-selector.css'
})
export class ClientSelectorComponent implements OnInit {
  @Input() initialClient: any = null;
  @Input() initialLeadId: string | null = null;
  @Output() clientSelected = new EventEmitter<ClientSelection>();

  leads: any[] = [];
  filteredLeads: any[] = [];
  loading = false;
  searchTerm = '';

  newClientName = '';
  newClientEmail = '';
  newClientPhone = '';

  showNewClientForm = false;
  selectedLead: any = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadLeads();
    
    if (this.initialLeadId) {
      this.showNewClientForm = false;
    } else if (this.initialClient) {
      this.showNewClientForm = true;
      this.newClientName = this.initialClient.name || '';
      this.newClientEmail = this.initialClient.email || '';
      this.newClientPhone = this.initialClient.phone || '';
    }
  }

  loadLeads(): void {
    this.loading = true;
    this.api.getLeads().subscribe({
      next: (res: any) => {
        this.leads = Array.isArray(res) ? res : (res?.data || []);
        this.filteredLeads = [...this.leads];
        this.loading = false;
        
        if (this.initialLeadId) {
          this.selectedLead = this.leads.find(l => l.id === this.initialLeadId);
          if (this.selectedLead) {
            this.emitSelection();
          }
        }
      },
      error: (err) => {
        console.error('Error loading leads', err);
        this.loading = false;
      }
    });
  }

  onLeadSelect(leadId: string | null): void {
    if (leadId) {
      this.selectedLead = this.leads.find(l => l.id === leadId);
      this.showNewClientForm = false;
    } else {
      this.selectedLead = null;
    }
    this.emitSelection();
  }

  toggleNewClient(): void {
    this.showNewClientForm = !this.showNewClientForm;
    if (this.showNewClientForm) {
      this.selectedLead = null;
      this.newClientName = '';
      this.newClientEmail = '';
      this.newClientPhone = '';
    } else {
      this.newClientName = '';
      this.newClientEmail = '';
      this.newClientPhone = '';
    }
    this.emitSelection();
  }

  onNewClientChange(): void {
    this.emitSelection();
  }

  private emitSelection(): void {
    const selection: ClientSelection = {
      leadId: this.selectedLead?.id || null,
      createNew: this.showNewClientForm,
      client: this.showNewClientForm ? {
        name: this.newClientName,
        email: this.newClientEmail,
        phone: this.newClientPhone
      } : {
        name: this.selectedLead?.name || '',
        email: this.selectedLead?.email || '',
        phone: this.selectedLead?.phone || ''
      }
    };
    this.clientSelected.emit(selection);
  }
}
