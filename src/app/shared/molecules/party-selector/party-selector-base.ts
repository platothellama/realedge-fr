import { Observable } from 'rxjs';
import { ApiService } from '../../../services/api';

/**
 * Shared state machine behind the client/seller selectors (Atomic Design:
 * molecules/party-selector). Extracted byte-for-byte from the two
 * rename-clone implementations with zero behavior change:
 * - same load → normalize → find-by-initial-id → conditional emit flow
 * - same select / toggle-clear / draft-change flows
 * - same console.error labels (provided by subclasses)
 *
 * Public contracts (selectors, @Inputs, @Outputs, payload shapes, templates)
 * stay on the subclasses; this base only owns the duplicated mechanics.
 */
export interface PartyDraft {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}

export function emptyPartyDraft(): PartyDraft {
  return { name: '', email: '', phone: '', address: '', city: '', country: '' };
}

/** Identical normalization used by both selectors: array or { data } envelope. */
export function normalizePartyListResponse(res: unknown): any[] {
  return Array.isArray(res) ? res : ((res as { data?: unknown })?.data as any[] | undefined) || [];
}

export abstract class PartySelectorBase {
  items: any[] = [];
  filteredItems: any[] = [];
  loading = false;
  showNewForm = false;
  selected: any = null;
  draft: PartyDraft = emptyPartyDraft();

  constructor(protected api: ApiService) {}

  /** Endpoint observable: getLeads() vs getSellers(). */
  protected abstract fetchAll(): Observable<any[]>;
  /** initialLeadId vs initialSellerId (truthiness preserved). */
  protected abstract initialId(): string | null | undefined;
  /** initialClient vs initialSeller object (or null). */
  protected abstract initialObject(): any;
  /** Map the initial object into the draft (3 vs 6 fields). */
  protected abstract prefillDraft(obj: any): void;
  /** Reset draft fields on toggle (3 vs 6 fields). */
  protected abstract clearDraft(): void;
  /** 'Error loading leads' vs 'Error loading sellers'. */
  protected abstract loadErrorLabel(): string;
  /** Map base state to the legacy payload shape (ClientSelection/SellerSelection). */
  protected abstract toLegacySelection(): unknown;
  protected abstract emitLegacy(selection: unknown): void;

  /** Called from subclass ngOnInit; mirrors the original ngOnInit exactly. */
  protected initSelector(): void {
    this.loadItems();

    if (this.initialId()) {
      this.showNewForm = false;
    } else if (this.initialObject()) {
      this.showNewForm = true;
      this.prefillDraft(this.initialObject());
    }
  }

  protected loadItems(): void {
    this.loading = true;
    this.fetchAll().subscribe({
      next: (res: any) => {
        this.items = normalizePartyListResponse(res);
        this.filteredItems = [...this.items];
        this.loading = false;

        const id = this.initialId();
        if (id) {
          this.selected = this.items.find((x) => x.id === id);
          if (this.selected) {
            this.emitSelection();
          }
        }
      },
      error: (err: any) => {
        console.error(this.loadErrorLabel(), err);
        this.loading = false;
      },
    });
  }

  onSelect(id: string | null): void {
    if (id) {
      this.selected = this.items.find((x) => x.id === id);
      this.showNewForm = false;
    } else {
      this.selected = null;
    }
    this.emitSelection();
  }

  toggleNewForm(): void {
    this.showNewForm = !this.showNewForm;
    if (this.showNewForm) {
      this.selected = null;
      this.clearDraft();
    } else {
      this.clearDraft();
    }
    this.emitSelection();
  }

  onDraftChange(): void {
    this.emitSelection();
  }

  protected emitSelection(): void {
    this.emitLegacy(this.toLegacySelection());
  }
}
