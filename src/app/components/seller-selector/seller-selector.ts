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

export interface SellerSelection {
  sellerId: string | null;
  createNew: boolean;
  seller: {
    name: string;
    email: string;
    phone: string;
    address?: string;
    city?: string;
    country?: string;
  };
}

@Component({
  selector: 'app-seller-selector',
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
  templateUrl: './seller-selector.html',
  styleUrl: './seller-selector.css'
})
export class SellerSelectorComponent implements OnInit {
  @Input() initialSellerId: string | null = null;
  @Input() initialSeller: any = null;
  @Output() sellerSelected = new EventEmitter<SellerSelection>();

  sellers: any[] = [];
  filteredSellers: any[] = [];
  loading = false;
  searchTerm = '';

  newSellerName = '';
  newSellerEmail = '';
  newSellerPhone = '';
  newSellerAddress = '';
  newSellerCity = '';
  newSellerCountry = '';

  showNewSellerForm = false;
  selectedSeller: any = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadSellers();
    
    if (this.initialSellerId) {
      this.showNewSellerForm = false;
    } else if (this.initialSeller) {
      this.showNewSellerForm = true;
      this.newSellerName = this.initialSeller.name || '';
      this.newSellerEmail = this.initialSeller.email || '';
      this.newSellerPhone = this.initialSeller.phone || '';
      this.newSellerAddress = this.initialSeller.address || '';
      this.newSellerCity = this.initialSeller.city || '';
      this.newSellerCountry = this.initialSeller.country || '';
    }
  }

  loadSellers(): void {
    this.loading = true;
    this.api.getSellers().subscribe({
      next: (res: any) => {
        this.sellers = Array.isArray(res) ? res : (res?.data || []);
        this.filteredSellers = [...this.sellers];
        this.loading = false;
        
        if (this.initialSellerId) {
          this.selectedSeller = this.sellers.find(s => s.id === this.initialSellerId);
          if (this.selectedSeller) {
            this.emitSelection();
          }
        }
      },
      error: (err) => {
        console.error('Error loading sellers', err);
        this.loading = false;
      }
    });
  }

  onSellerSelect(sellerId: string | null): void {
    if (sellerId) {
      this.selectedSeller = this.sellers.find(s => s.id === sellerId);
      this.showNewSellerForm = false;
    } else {
      this.selectedSeller = null;
    }
    this.emitSelection();
  }

  toggleNewSeller(): void {
    this.showNewSellerForm = !this.showNewSellerForm;
    if (this.showNewSellerForm) {
      this.selectedSeller = null;
      this.newSellerName = '';
      this.newSellerEmail = '';
      this.newSellerPhone = '';
      this.newSellerAddress = '';
      this.newSellerCity = '';
      this.newSellerCountry = '';
    } else {
      this.newSellerName = '';
      this.newSellerEmail = '';
      this.newSellerPhone = '';
      this.newSellerAddress = '';
      this.newSellerCity = '';
      this.newSellerCountry = '';
    }
    this.emitSelection();
  }

  onNewSellerChange(): void {
    this.emitSelection();
  }

  private emitSelection(): void {
    const selection: SellerSelection = {
      sellerId: this.selectedSeller?.id || null,
      createNew: this.showNewSellerForm,
      seller: this.showNewSellerForm ? {
        name: this.newSellerName,
        email: this.newSellerEmail,
        phone: this.newSellerPhone,
        address: this.newSellerAddress,
        city: this.newSellerCity,
        country: this.newSellerCountry
      } : {
        name: this.selectedSeller?.name || '',
        email: this.selectedSeller?.email || '',
        phone: this.selectedSeller?.phone || '',
        address: this.selectedSeller?.address || '',
        city: this.selectedSeller?.city || '',
        country: this.selectedSeller?.country || ''
      }
    };
    this.sellerSelected.emit(selection);
  }
}