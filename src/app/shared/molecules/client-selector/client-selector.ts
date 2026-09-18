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
  styleUrl: '../party-selector/party-selector.css'
})
export class ClientSelectorComponent extends PartySelectorBase implements OnInit {
  @Input() initialClient: any = null;
  @Input() initialLeadId: string | null = null;
  @Output() clientSelected = new EventEmitter<ClientSelection>();

  constructor(api: ApiService) {
    super(api);
  }

  ngOnInit(): void {
    this.initSelector();
  }

  protected override fetchAll(): Observable<any[]> {
    return this.api.getLeads();
  }

  protected override initialId(): string | null {
    return this.initialLeadId;
  }

  protected override initialObject(): any {
    return this.initialClient;
  }

  protected override prefillDraft(obj: any): void {
    this.draft.name = obj.name || '';
    this.draft.email = obj.email || '';
    this.draft.phone = obj.phone || '';
  }

  protected override clearDraft(): void {
    this.draft.name = '';
    this.draft.email = '';
    this.draft.phone = '';
  }

  protected override loadErrorLabel(): string {
    return 'Error loading leads';
  }

  protected override toLegacySelection(): ClientSelection {
    return {
      leadId: this.selected?.id || null,
      createNew: this.showNewForm,
      client: this.showNewForm
        ? {
            name: this.draft.name,
            email: this.draft.email,
            phone: this.draft.phone,
          }
        : {
            name: this.selected?.name || '',
            email: this.selected?.email || '',
            phone: this.selected?.phone || '',
          },
    };
  }

  protected override emitLegacy(selection: unknown): void {
    this.clientSelected.emit(selection as ClientSelection);
  }
}
