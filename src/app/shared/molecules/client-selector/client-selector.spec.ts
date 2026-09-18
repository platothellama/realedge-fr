import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ClientSelectorComponent } from './client-selector';
import { ApiService } from '../../../services/api';

const LEADS = [
  { id: 'l1', name: 'Jane', email: 'j@x.com', phone: '111', budget: 500 },
  { id: 'l2', name: 'Bob', email: 'b@x.com', phone: '222' },
];

function setup(
  inputs: Partial<Pick<ClientSelectorComponent, 'initialClient' | 'initialLeadId'>> = {}
) {
  TestBed.configureTestingModule({
    imports: [ClientSelectorComponent],
    providers: [{ provide: ApiService, useValue: { getLeads: () => of(LEADS) } }],
  });
  const fixture = TestBed.createComponent(ClientSelectorComponent);
  Object.assign(fixture.componentInstance, inputs);
  const emitted: unknown[] = [];
  fixture.componentInstance.clientSelected.subscribe((s) => emitted.push(s));
  fixture.detectChanges();
  return { fixture, cmp: fixture.componentInstance, emitted };
}

describe('ClientSelectorComponent (behavior contract)', () => {
  it('loads leads into the select and clears loading', () => {
    const { cmp, emitted } = setup();
    expect(cmp.items).toEqual(LEADS);
    expect(cmp.filteredItems).toEqual(LEADS);
    expect(cmp.loading).toBe(false);
    expect(emitted).toEqual([]);
  });

  it('auto-selects and emits when initialLeadId matches', () => {
    const { cmp, emitted } = setup({ initialLeadId: 'l1' });
    expect(cmp.showNewForm).toBe(false);
    expect(cmp.selected).toEqual(LEADS[0]);
    expect(emitted).toEqual([
      {
        leadId: 'l1',
        createNew: false,
        client: { name: 'Jane', email: 'j@x.com', phone: '111' },
      },
    ]);
  });

  it('prefills the new-client form from initialClient', () => {
    const { cmp } = setup({ initialClient: { name: 'N', email: 'e', phone: 'p' } });
    expect(cmp.showNewForm).toBe(true);
    expect(cmp.draft.name).toBe('N');
    expect(cmp.draft.email).toBe('e');
    expect(cmp.draft.phone).toBe('p');
  });

  it('onSelect emits the existing-lead payload and hides the form', () => {
    const { cmp, emitted } = setup();
    cmp.onSelect('l2');
    expect(cmp.selected).toEqual(LEADS[1]);
    expect(cmp.showNewForm).toBe(false);
    expect(emitted).toEqual([
      {
        leadId: 'l2',
        createNew: false,
        client: { name: 'Bob', email: 'b@x.com', phone: '222' },
      },
    ]);
  });

  it('onSelect(null) clears the selection and emits null leadId', () => {
    const { cmp, emitted } = setup({ initialLeadId: 'l1' });
    emitted.length = 0;
    cmp.onSelect(null);
    expect(cmp.selected).toBeNull();
    expect(emitted).toEqual([
      { leadId: null, createNew: false, client: { name: '', email: '', phone: '' } },
    ]);
  });

  it('toggleNewForm flips mode, clears fields and emits createNew', () => {
    const { cmp, emitted } = setup({ initialLeadId: 'l1' });
    emitted.length = 0;
    cmp.toggleNewForm();
    expect(cmp.showNewForm).toBe(true);
    expect(cmp.selected).toBeNull();
    expect(emitted).toEqual([
      { leadId: null, createNew: true, client: { name: '', email: '', phone: '' } },
    ]);
    cmp.draft.name = 'Zed';
    cmp.onDraftChange();
    expect(emitted[1]).toEqual({
      leadId: null,
      createNew: true,
      client: { name: 'Zed', email: '', phone: '' },
    });
  });

  it('onDraftChange emits the draft payload', () => {
    const { cmp, emitted } = setup();
    cmp.toggleNewForm();
    emitted.length = 0;
    cmp.draft.name = 'Zed';
    cmp.draft.email = 'z@x.com';
    cmp.draft.phone = '999';
    cmp.onDraftChange();
    expect(emitted).toEqual([
      {
        leadId: null,
        createNew: true,
        client: { name: 'Zed', email: 'z@x.com', phone: '999' },
      },
    ]);
  });
});
