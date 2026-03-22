import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
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
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule
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

  clientForm: FormGroup;
  showNewClientForm = false;
  selectedLead: any = null;

  constructor(
    private fb: FormBuilder,
    private api: ApiService
  ) {
    this.clientForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadLeads();
    
    if (this.initialLeadId) {
      this.showNewClientForm = false;
    } else if (this.initialClient) {
      this.showNewClientForm = true;
      this.clientForm.patchValue(this.initialClient);
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

  filterLeads(term: string): void {
    this.searchTerm = term;
    if (!term) {
      this.filteredLeads = [...this.leads];
    } else {
      const lower = term.toLowerCase();
      this.filteredLeads = this.leads.filter(lead => 
        lead.name?.toLowerCase().includes(lower) ||
        lead.email?.toLowerCase().includes(lower) ||
        lead.phone?.includes(term)
      );
    }
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
      this.clientForm.reset();
    } else {
      this.clientForm.reset();
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
      client: this.showNewClientForm ? this.clientForm.value : {
        name: this.selectedLead?.name || '',
        email: this.selectedLead?.email || '',
        phone: this.selectedLead?.phone || ''
      }
    };
    this.clientSelected.emit(selection);
  }

  get displayValue(): string {
    if (this.selectedLead) {
      return this.selectedLead.name;
    }
    if (this.showNewClientForm) {
      return 'Create New Client';
    }
    return '';
  }
}
