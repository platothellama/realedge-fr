import {
  findMissingHeaders,
  normalizeHeader,
  parseYesNo,
  splitFeatures,
  validateImportRow,
} from './property-import-validator';

function row(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Sunny apartment',
    price: 250000,
    type: 'Apartment',
    address: '123 Marina Walk',
    city: 'Dubai',
    country: 'UAE',
    ...overrides,
  };
}

describe('property-import-validator', () => {
  it('accepts a fully valid row', () => {
    const r = validateImportRow(row(), 2);
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.data.listingType).toBe('Sale');
    expect(r.data.condition).toBe('Used');
    expect(r.data.status).toBe('Available');
  });

  it('flags every missing required field', () => {
    const r = validateImportRow(
      row({ title: '', price: '', type: '', address: ' ', city: '', country: '' }),
      5
    );
    expect(r.valid).toBe(false);
    expect(r.excelRow).toBe(5);
    expect(r.errors.length).toBeGreaterThanOrEqual(6);
  });

  it('rejects unknown type and sold status (create-only)', () => {
    const r = validateImportRow(row({ type: 'Castle', status: 'Sold' }), 2);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('Type must be one of'))).toBe(true);
    expect(r.errors.some((e) => e.includes('Available or Reserved'))).toBe(true);
  });

  it('matches enums case-insensitively', () => {
    const r = validateImportRow(
      row({ type: 'villa', listingtype: 'rent', condition: 'new', status: 'reserved' }),
      2
    );
    expect(r.valid).toBe(true);
    expect(r.data.type).toBe('Villa');
    expect(r.data.listingType).toBe('Rent');
  });

  it('rejects negative price and non-integer bedrooms', () => {
    const r = validateImportRow(row({ price: -5, bedrooms: 1.5 }), 2);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.startsWith('Price'))).toBe(true);
    expect(r.errors.some((e) => e.startsWith('Bedrooms'))).toBe(true);
  });

  it('accepts master bedrooms within total and rejects overflow', () => {
    expect(validateImportRow(row({ bedrooms: 3, masterbedrooms: 2 }), 2).valid).toBe(true);
    const bad = validateImportRow(row({ bedrooms: 2, masterbedrooms: 3 }), 2);
    expect(bad.valid).toBe(false);
    expect(bad.errors.some((e) => e.includes('Master bedrooms'))).toBe(true);
  });

  it('accepts balcony counts and rejects negatives / fractions', () => {
    expect(validateImportRow(row({ balconies: 2 }), 2).valid).toBe(true);
    expect(validateImportRow(row(), 2).data.balconies).toBe(0);
    const bad = validateImportRow(row({ balconies: -1 }), 2);
    expect(bad.valid).toBe(false);
    expect(bad.errors.some((e) => e.startsWith('Balconies'))).toBe(true);
    expect(validateImportRow(row({ balconies: 1.5 }), 2).valid).toBe(false);
  });

  it('parses YES/NO variants and flags garbage', () => {
    expect(parseYesNo('YES')).toBe(true);
    expect(parseYesNo('no')).toBe(false);
    expect(parseYesNo('')).toBeNull();
    expect(parseYesNo('maybe')).toBe('invalid');
    expect(validateImportRow(row({ hasterrace: 'maybe' }), 2).valid).toBe(false);
  });

  it('splits features on ; and , and dedupes', () => {
    expect(splitFeatures('Pool; Garage, Pool ;Balcony')).toEqual(['Pool', 'Garage', 'Balcony']);
    expect(splitFeatures('')).toEqual([]);
  });

  it('validates coordinate ranges', () => {
    expect(validateImportRow(row({ lat: 999 }), 2).valid).toBe(false);
    expect(validateImportRow(row({ lng: -200 }), 2).valid).toBe(false);
    expect(validateImportRow(row({ lat: 25.2, lng: 55.27 }), 2).valid).toBe(true);
  });

  it('detects missing required headers', () => {
    expect(findMissingHeaders(['title', 'price'])).toEqual([
      'type',
      'address',
      'city',
      'country',
    ]);
    expect(findMissingHeaders(['title', 'price', 'type', 'address', 'city', 'country'])).toEqual(
      []
    );
  });

  it('normalizes headers case-insensitively', () => {
    expect(normalizeHeader('  Title ')).toBe('title');
    expect(normalizeHeader('ListingType')).toBe('listingtype');
  });
});
