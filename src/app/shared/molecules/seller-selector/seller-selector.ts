import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ApiService } from '../../../services/api';
import { PartySelectorBase } from '../party-selector/party-selector-base';

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
  styleUrl: '../party-selector/party-selector.css'
})
export class SellerSelectorComponent extends PartySelectorBase implements OnInit {
  @Input() initialSellerId: string | null = null;
  @Input() initialSeller: any = null;
  @Output() sellerSelected = new EventEmitter<SellerSelection>();

  constructor(api: ApiService) {
    super(api);
  }

  ngOnInit(): void {
    this.initSelector();
  }

  protected override fetchAll(): Observable<any[]> {
    return this.api.getSellers();
  }

  protected override initialId(): string | null {
    return this.initialSellerId;
  }

  protected override initialObject(): any {
    return this.initialSeller;
  }

  protected override prefillDraft(obj: any): void {
    this.draft.name = obj.name || '';
    this.draft.email = obj.email || '';
    this.draft.phone = obj.phone || '';
    this.draft.address = obj.address || '';
    this.draft.city = obj.city || '';
    this.draft.country = obj.country || '';
  }

  protected override clearDraft(): void {
    this.draft.name = '';
    this.draft.email = '';
    this.draft.phone = '';
    this.draft.address = '';
    this.draft.city = '';
    this.draft.country = '';
  }

  protected override loadErrorLabel(): string {
    return 'Error loading sellers';
  }

  protected override toLegacySelection(): SellerSelection {
    return {
      sellerId: this.selected?.id || null,
      createNew: this.showNewForm,
      seller: this.showNewForm
        ? {
            name: this.draft.name,
            email: this.draft.email,
            phone: this.draft.phone,
            address: this.draft.address,
            city: this.draft.city,
            country: this.draft.country,
          }
        : {
            name: this.selected?.name || '',
            email: this.selected?.email || '',
            phone: this.selected?.phone || '',
            address: this.selected?.address || '',
            city: this.selected?.city || '',
            country: this.selected?.country || '',
          },
    };
  }

  protected override emitLegacy(selection: unknown): void {
    this.sellerSelected.emit(selection as SellerSelection);
  }
}
