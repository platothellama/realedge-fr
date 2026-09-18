import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SellerSelectorComponent } from './seller-selector';
import { ApiService } from '../../../services/api';

const SELLERS = [
  {
    id: 's1',
    name: 'Sam',
    email: 's@x.com',
    phone: '111',
    city: 'Beirut',
    country: 'Lebanon',
  },
  { id: 's2', name: 'Ann', email: '', phone: '222' },
];

function setup(
  inputs: Partial<Pick<SellerSelectorComponent, 'initialSeller' | 'initialSellerId'>> = {}
) {
  TestBed.configureTestingModule({
    imports: [SellerSelectorComponent],
    providers: [{ provide: ApiService, useValue: { getSellers: () => of(SELLERS) } }],
  });
  const fixture = TestBed.createComponent(SellerSelectorComponent);
  Object.assign(fixture.componentInstance, inputs);
  const emitted: unknown[] = [];
  fixture.componentInstance.sellerSelected.subscribe((s) => emitted.push(s));
  fixture.detectChanges();
  return { fixture, cmp: fixture.componentInstance, emitted };
}

describe('SellerSelectorComponent (behavior contract)', () => {
  it('loads sellers (incl. unused filtered copy) and clears loading', () => {
    const { cmp, emitted } = setup();
    expect(cmp.items).toEqual(SELLERS);
    expect(cmp.filteredItems).toEqual(SELLERS);
    expect(cmp.loading).toBe(false);
    expect(emitted).toEqual([]);
  });

  it('auto-selects and emits when initialSellerId matches', () => {
    const { cmp, emitted } = setup({ initialSellerId: 's1' });
    expect(cmp.showNewForm).toBe(false);
    expect(cmp.selected).toEqual(SELLERS[0]);
    expect(emitted).toEqual([
      {
        sellerId: 's1',
        createNew: false,
        seller: {
          name: 'Sam',
          email: 's@x.com',
          phone: '111',
          address: '',
          city: 'Beirut',
          country: 'Lebanon',
        },
      },
    ]);
  });

  it('prefills the new-seller form from initialSeller incl. address fields', () => {
    const { cmp } = setup({
      initialSeller: {
        name: 'N',
        email: 'e',
        phone: 'p',
        address: 'a',
        city: 'c',
        country: 'cc',
      },
    });
    expect(cmp.showNewForm).toBe(true);
    expect(cmp.draft.name).toBe('N');
    expect(cmp.draft.address).toBe('a');
    expect(cmp.draft.city).toBe('c');
    expect(cmp.draft.country).toBe('cc');
  });

  it('onSelect emits the existing-seller payload and hides the form', () => {
    const { cmp, emitted } = setup();
    cmp.onSelect('s2');
    expect(cmp.selected).toEqual(SELLERS[1]);
    expect(cmp.showNewForm).toBe(false);
    expect(emitted).toEqual([
      {
        sellerId: 's2',
        createNew: false,
        seller: {
          name: 'Ann',
          email: '',
          phone: '222',
          address: '',
          city: '',
          country: '',
        },
      },
    ]);
  });

  it('toggleNewForm flips mode, clears all six fields and emits createNew', () => {
    const { cmp, emitted } = setup({ initialSellerId: 's1' });
    emitted.length = 0;
    cmp.toggleNewForm();
    expect(cmp.showNewForm).toBe(true);
    expect(cmp.selected).toBeNull();
    expect(cmp.draft.address).toBe('');
    expect(emitted).toEqual([
      {
        sellerId: null,
        createNew: true,
        seller: { name: '', email: '', phone: '', address: '', city: '', country: '' },
      },
    ]);
  });

  it('onDraftChange emits the draft payload with address fields', () => {
    const { cmp, emitted } = setup();
    cmp.toggleNewForm();
    emitted.length = 0;
    cmp.draft.name = 'Zed';
    cmp.draft.city = 'Tyre';
    cmp.onDraftChange();
    expect(emitted).toEqual([
      {
        sellerId: null,
        createNew: true,
        seller: {
          name: 'Zed',
          email: '',
          phone: '',
          address: '',
          city: 'Tyre',
          country: '',
        },
      },
    ]);
  });
});
