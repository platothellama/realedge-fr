import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api';
import { ClientSelectorComponent, ClientSelection } from '../client-selector/client-selector';
import { SellerSelectorComponent, SellerSelection } from '../seller-selector/seller-selector';

@Component({
  selector: 'app-deal-form',
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
    ClientSelectorComponent,
    SellerSelectorComponent
  ],
  templateUrl: './deal-form.html',
  styleUrl: './deal-form.css'
})
export class DealFormComponent implements OnInit {
  dealForm: FormGroup;
  isEdit = false;
  properties: any[] = [];
  brokers: any[] = [];
  leads: any[] = [];
  currentUser: any = null;
  isAdmin = false;
  isSubmitting = false;
  preSelectedPropertyId: string | null = null;
  selectedClient: ClientSelection | null = null;
  sellerSelection: SellerSelection | null = null;
  initialSellerId: string | null = null;
  initialSeller: any = null;

  stages = ['Negotiation', 'Reserved', 'Contract Signed', 'Payment', 'Closed'];

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private dialogRef: MatDialogRef<DealFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.dealForm = this.fb.group({
      title: ['', Validators.required],
      sellerName: [''],
      commission: [{ value: 0, disabled: true }, [Validators.required, Validators.min(0)]],
      dealStage: ['Offer Made', Validators.required],
      notes: [''],
      propertyId: ['', Validators.required],
      brokerId: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.data && this.data.deal) {
      this.isEdit = true;
      this.dealForm.patchValue({
        title: this.data.deal.title,
        sellerName: this.data.deal.sellerName,
        commission: this.data.deal.commission,
        dealStage: this.data.deal.dealStage,
        notes: this.data.deal.notes,
        propertyId: this.data.deal.propertyId,
        brokerId: this.data.deal.brokerId
      });
      
      this.selectedClient = {
        leadId: this.data.deal.buyerLeadId || null,
        createNew: !this.data.deal.buyerLeadId,
        client: {
          name: this.data.deal.buyerName || '',
          email: '',
          phone: ''
        }
      };

      if (this.data.deal.sellerId) {
        this.initialSellerId = this.data.deal.sellerId;
        this.sellerSelection = {
          sellerId: this.data.deal.sellerId,
          createNew: false,
          seller: {
            name: this.data.deal.seller?.name || this.data.deal.sellerName || '',
            email: this.data.deal.seller?.email || '',
            phone: this.data.deal.seller?.phone || '',
            address: this.data.deal.seller?.address || '',
            city: this.data.deal.seller?.city || '',
            country: this.data.deal.seller?.country || ''
          }
        };
      } else if (this.data.deal.seller) {
        this.initialSeller = {
          name: this.data.deal.seller.name || '',
          email: this.data.deal.seller.email || '',
          phone: this.data.deal.seller.phone || ''
        };
        this.sellerSelection = {
          sellerId: null,
          createNew: true,
          seller: {
            name: this.data.deal.seller.name || '',
            email: this.data.deal.seller.email || '',
            phone: this.data.deal.seller.phone || '',
            address: this.data.deal.seller.address || '',
            city: this.data.deal.seller.city || '',
            country: this.data.deal.seller.country || ''
          }
        };
      } else if (this.data.deal.sellerName && !this.data.deal.sellerId) {
        this.initialSeller = {
          name: this.data.deal.sellerName,
          email: '',
          phone: ''
        };
        this.sellerSelection = {
          sellerId: null,
          createNew: true,
          seller: {
            name: this.data.deal.sellerName,
            email: '',
            phone: '',
            address: '',
            city: '',
            country: ''
          }
        };
      }
    }
    
    if (this.data && this.data.propertyId) {
      this.preSelectedPropertyId = this.data.propertyId;
    }

    if (this.data && this.data.sellerId) {
      this.initialSellerId = this.data.sellerId;
      this.sellerSelection = {
        sellerId: this.data.sellerId,
        createNew: false,
        seller: {
          name: this.data.seller?.name || this.data.sellerName || '',
          email: this.data.seller?.email || '',
          phone: this.data.seller?.phone || '',
          address: this.data.seller?.address || '',
          city: this.data.seller?.city || '',
          country: this.data.seller?.country || ''
        }
      };
    } else if (this.data && this.data.seller) {
      this.initialSeller = this.data.seller;
      this.sellerSelection = {
        sellerId: null,
        createNew: true,
        seller: {
          name: this.data.seller.name || '',
          email: this.data.seller.email || '',
          phone: this.data.seller.phone || '',
          address: this.data.seller.address || '',
          city: this.data.seller.city || '',
          country: this.data.seller.country || ''
        }
      };
    } else if (this.data && this.data.sellerName) {
      this.initialSeller = {
        name: this.data.sellerName,
        email: '',
        phone: ''
      };
      this.sellerSelection = {
        sellerId: null,
        createNew: true,
        seller: {
          name: this.data.sellerName,
          email: '',
          phone: '',
          address: '',
          city: '',
          country: ''
        }
      };
    }
    
    this.loadInitialData();
  }

  private loadInitialData() {
    // Check user role for commission editing
    this.api.getMe().subscribe(user => {
      this.currentUser = user;
      this.isAdmin = user.role === 'Super Admin' || user.role === 'Admin';

      if (this.isAdmin) {
        this.dealForm.get('commission')?.enable();
      }

      // Default broker to current user if not editing
      if (!this.isEdit) {
        this.dealForm.get('brokerId')?.setValue(user.id);
      }
    });

    this.api.getProperties().subscribe(res => {
      this.properties = Array.isArray(res) ? res : (res.data || []);
      
      if (this.preSelectedPropertyId) {
        this.dealForm.get('propertyId')?.setValue(this.preSelectedPropertyId);
        this.calculateCommission(this.preSelectedPropertyId);
        this.autoPopulateSellerFromProperty(this.preSelectedPropertyId);
      } else {
        const selectedId = this.dealForm.get('propertyId')?.value;
        if (selectedId) {
          this.calculateCommission(selectedId);
          this.autoPopulateSellerFromProperty(selectedId);
        }
      }
    });
    this.api.getUsers().subscribe(res => {
      this.brokers = Array.isArray(res) ? res : (res.data || []);
    });
    this.api.getLeads().subscribe((res: any) => {
      this.leads = Array.isArray(res) ? res : (res?.data || []);
    });

    // Watch for property selection changes
    this.dealForm.get('propertyId')?.valueChanges.subscribe(id => {
      if (id) {
        this.calculateCommission(id);
        this.autoPopulateSellerFromProperty(id);
      }
    });
  }

  private autoPopulateSellerFromProperty(propertyId: string) {
    if (!this.sellerSelection) {
      const property = this.properties.find(p => p.id === propertyId);
      if (property && property.sellerId) {
        this.initialSellerId = property.sellerId;
        this.sellerSelection = {
          sellerId: property.sellerId,
          createNew: false,
          seller: {
            name: property.seller?.name || '',
            email: property.seller?.email || '',
            phone: property.seller?.phone || '',
            address: property.seller?.address || '',
            city: property.seller?.city || '',
            country: property.seller?.country || ''
          }
        };
      } else if (property && property.seller) {
        this.initialSeller = property.seller;
        this.sellerSelection = {
          sellerId: null,
          createNew: true,
          seller: {
            name: property.seller.name || '',
            email: property.seller.email || '',
            phone: property.seller.phone || '',
            address: property.seller.address || '',
            city: property.seller.city || '',
            country: property.seller.country || ''
          }
        };
      }
    }
  }

  private calculateCommission(propertyId: string) {
    const property = this.properties.find(p => p.id === propertyId);
    if (property && property.commissionPercentage > 0) {
      const calculated = (Number(property.price) * property.commissionPercentage) / 100;
      this.dealForm.get('commission')?.setValue(calculated);
    }
  }

  onSubmit(): void {
    if (this.dealForm.valid && !this.isSubmitting && this.selectedClient && this.sellerSelection) {
      this.isSubmitting = true;
      const val = this.dealForm.getRawValue();
      const payload: any = {
        ...val,
        buyerLeadId: this.selectedClient.leadId,
        buyerName: this.selectedClient.client.name
      };

      if (this.sellerSelection.createNew && this.sellerSelection.seller.name) {
        payload.newSeller = this.sellerSelection.seller;
        payload.sellerName = this.sellerSelection.seller.name;
      } else if (this.sellerSelection.sellerId) {
        payload.sellerId = this.sellerSelection.sellerId;
        payload.sellerName = this.sellerSelection.seller.name;
      }

      this.dialogRef.close(payload);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSellerSelected(selection: SellerSelection): void {
    this.sellerSelection = selection;
  }

  onClientSelected(selection: ClientSelection): void {
    this.selectedClient = selection;
    if (!selection.createNew && selection.leadId) {
      this.dealForm.get('buyerLeadId')?.setValue(selection.leadId);
    }
  }

  getPropertyTitle(propertyId: string): string {
    const prop = this.properties.find(p => p.id === propertyId);
    return prop ? `${prop.title} - $${prop.price?.toLocaleString()}` : 'Loading...';
  }
}
