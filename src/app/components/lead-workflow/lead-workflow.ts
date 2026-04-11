import { Component, Inject, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ApiService } from '../../services/api';
import { LeadFormComponent } from '../lead-form/lead-form';
import { ClientSelectorComponent, ClientSelection } from '../client-selector/client-selector';

export interface LeadWorkflowResult {
  leads: any[];
  visit?: any;
  deal?: any;
}

@Component({
  selector: 'app-lead-workflow',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ClientSelectorComponent
  ],
  templateUrl: './lead-workflow.html',
  styleUrl: './lead-workflow.css'
})
export class LeadWorkflowComponent implements OnInit {
  currentStep = 0;
  leads: any[] = [];
  isSubmitting = false;
  isAddingLead = false;
  visitScheduled = false;
  dealCreated = false;
  selectedClient: ClientSelection | null = null;
  leadMode: 'existing' | 'new' = 'existing';

  visitForm: FormGroup;
  dealForm: FormGroup;
  leadForm: FormGroup;
  brokers: any[] = [];
  properties: any[] = [];
  currentUser: any = null;
  isAdmin = false;
  showAssignmentDropdown = false;
  stages = ['Negotiation', 'Reserved', 'Contract Signed', 'Payment', 'Closed'];

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<LeadWorkflowComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    const user = this.data?.currentUser;
    this.currentUser = user;
    const userRole = user?.role || '';
    this.isAdmin = userRole === 'Super Admin';
    this.showAssignmentDropdown = this.isAdmin;

    this.visitForm = this.fb.group({
      title: ['', Validators.required],
      visitDate: [new Date(), Validators.required],
      visitTime: ['10:00', Validators.required],
      status: ['Scheduled', Validators.required],
      propertyId: [data?.propertyId || null, Validators.required],
      brokerId: [user?.id || null, Validators.required],
      notes: ['']
    });

    this.dealForm = this.fb.group({
      title: ['', Validators.required],
      sellerName: [''],
      dealStage: ['Negotiation', Validators.required],
      notes: [''],
      propertyId: [data?.propertyId || '', Validators.required],
      brokerId: [user?.id || null, Validators.required]
    });

    this.leadForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      source: ['Website', Validators.required],
      status: ['New Lead', Validators.required],
      budget: [null],
      nationality: [''],
      preferredAreas: [''],
      propertyPreferences: [''],
      notes: [''],
      assignedToUserId: [null]
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.api.getLeads().subscribe({
      next: (res: any) => {
        console.log('Leads API response:', res);
        this.leads = Array.isArray(res) ? res : (res?.data || []);
        console.log('Loaded leads:', this.leads);
      }
    });

    this.api.getUsers().subscribe(res => {
      this.brokers = Array.isArray(res) ? res : (res.data || []);
    });

    this.api.getMe().subscribe(user => {
      this.currentUser = user;
      this.isAdmin = user.role === 'Super Admin';
      this.visitForm.get('brokerId')?.setValue(user.id);
      this.dealForm.get('brokerId')?.setValue(user.id);
    });
  }

  addLead() {
    if (this.leadForm.invalid) return;
    
    this.isAddingLead = true;
    const leadData = {
      ...this.leadForm.value,
      propertyId: this.data?.propertyId
    };

    this.api.createLead(leadData).subscribe({
      next: (newLead: any) => {
        newLead.selected = true;
        this.leads.unshift(newLead);
        this.isAddingLead = false;
        this.leadForm.reset({
          source: 'Website',
          status: 'New Lead'
        });
        this.leadMode = 'existing';
        this.proceedToVisit();
        this.snackBar.open('Lead added successfully!', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error creating lead', err);
        this.isAddingLead = false;
        this.snackBar.open('Failed to add lead', 'Close', { duration: 3000 });
      }
    });
  }

  openAddLeadDialog() {
    const dialogRef = this.dialog.open(LeadFormComponent, {
      width: '600px',
      data: { propertyId: this.data?.propertyId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.api.createLead(result).subscribe({
          next: (newLead) => {
            this.leads.push(newLead);
            this.snackBar.open('Lead added successfully!', 'Close', { duration: 3000 });
          },
          error: (err) => {
            console.error('Error creating lead', err);
            this.snackBar.open('Failed to add lead', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  toggleLeadSelection(lead: any, event: any) {
    if (event.checked) {
      lead.selected = true;
    } else {
      lead.selected = false;
    }
  }

  getSelectedLeads(): any[] {
    return this.leads.filter(l => l.selected);
  }

  proceedToVisit() {
    const selected = this.getSelectedLeads();
    if (selected.length === 0) {
      this.snackBar.open('Please select at least one lead', 'Close', { duration: 3000 });
      return;
    }
    
    const firstLead = selected[0];
    this.selectedClient = {
      leadId: firstLead.id,
      createNew: false,
      client: {
        name: firstLead.name,
        email: firstLead.email || '',
        phone: firstLead.phone || ''
      }
    };
    
    this.visitForm.patchValue({
      title: `Visit for ${this.data?.property?.title || 'Property'}`
    });
    
    this.currentStep = 1;
  }

  onClientSelected(selection: ClientSelection) {
    this.selectedClient = selection;
  }

  submitVisit() {
    if (!this.visitForm.valid || !this.selectedClient) {
      this.snackBar.open('Please fill all required fields', 'Close', { duration: 3000 });
      return;
    }

    this.isSubmitting = true;
    const val = this.visitForm.value;
    const date = new Date(val.visitDate);
    const [hours, minutes] = val.visitTime.split(':');
    date.setHours(parseInt(hours), parseInt(minutes));

    const payload = {
      title: val.title,
      visitDate: date.toISOString(),
      status: val.status,
      propertyId: val.propertyId,
      brokerId: val.brokerId,
      notes: val.notes,
      leadId: this.selectedClient.leadId,
      clientName: this.selectedClient.client.name,
      clientEmail: this.selectedClient.client.email,
      clientPhone: this.selectedClient.client.phone
    };

    this.api.createVisit(payload).subscribe({
      next: () => {
        this.visitScheduled = true;
        this.isSubmitting = false;
        this.snackBar.open('Visit scheduled successfully!', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error creating visit', err);
        this.isSubmitting = false;
        this.snackBar.open('Failed to schedule visit', 'Close', { duration: 3000 });
      }
    });
  }

  skipVisit() {
    this.currentStep = 2;
  }

  proceedToDeal() {
    this.currentStep = 2;
  }

  previousStep() {
    this.currentStep--;
  }

  submitDeal() {
    if (!this.dealForm.valid || !this.selectedClient) {
      this.snackBar.open('Please fill all required fields', 'Close', { duration: 3000 });
      return;
    }

    this.isSubmitting = true;
    const val = this.dealForm.getRawValue();

    const payload: any = {
      ...val,
      buyerLeadId: this.selectedClient.leadId,
      buyerName: this.selectedClient.client.name
    };

    this.api.createDeal(payload).subscribe({
      next: () => {
        this.dealCreated = true;
        this.isSubmitting = false;
        this.snackBar.open('Deal created successfully!', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error creating deal', err);
        this.isSubmitting = false;
        this.snackBar.open('Failed to create deal', 'Close', { duration: 3000 });
      }
    });
  }

  skipDeal() {
    this.finishWorkflow();
  }

  finishWorkflow() {
    const result: LeadWorkflowResult = {
      leads: this.getSelectedLeads()
    };
    this.dialogRef.close(result);
  }

  close() {
    this.dialogRef.close();
  }

  getPropertyTitle(): string {
    if (this.data?.propertyId && this.properties.length) {
      const prop = this.properties.find(p => p.id === this.data.propertyId);
      return prop?.title || 'Selected Property';
    }
    return '';
  }
}
