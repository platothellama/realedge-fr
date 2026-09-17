/**
 * Single source of truth for the property Excel import template.
 * Strictly property-only: no seller/owner columns.
 *
 * Header names are matched case-insensitively on import
 * (e.g. "Title", "TITLE" and "title" all work).
 */

export interface ImportColumnDef {
  /** Exact header text written into the template. */
  key: string;
  required: boolean;
  description: string;
}

export const IMPORT_SHEET_NAME = 'Properties';
export const IMPORT_INSTRUCTIONS_SHEET = 'Instructions';
export const IMPORT_TEMPLATE_FILENAME = 'property-import-template.xlsx';
export const IMPORT_MAX_ROWS = 500;
export const IMPORT_MAX_FILE_MB = 10;

export const IMPORT_REQUIRED_KEYS = [
  'title',
  'price',
  'type',
  'address',
  'city',
  'country',
] as const;

export const IMPORT_PROPERTY_TYPES = [
  'Apartment',
  'House',
  'Villa',
  'Office',
  'Land',
  'Commercial',
] as const;

export const IMPORT_LISTING_TYPES = ['Sale', 'Rent'] as const;
export const IMPORT_CONDITIONS = ['Used', 'New'] as const;

/**
 * Only statuses that make sense for a create-only import.
 * Sold / Rented / Lost require deal history and are excluded.
 */
export const IMPORT_STATUSES = ['Available', 'Reserved'] as const;

export const IMPORT_COLUMNS: ImportColumnDef[] = [
  { key: 'title', required: true, description: 'Property title (required)' },
  { key: 'price', required: true, description: 'Listing price, number >= 0 (required)' },
  { key: 'type', required: true, description: 'Apartment, House, Villa, Office, Land, Commercial (required)' },
  { key: 'address', required: true, description: 'Street address (required)' },
  { key: 'city', required: true, description: 'City (required)' },
  { key: 'country', required: true, description: 'Country (required)' },
  { key: 'description', required: false, description: 'Free-text description' },
  { key: 'listingType', required: false, description: 'Sale or Rent (default Sale)' },
  { key: 'condition', required: false, description: 'Used or New (default Used)' },
  { key: 'status', required: false, description: 'Available or Reserved (default Available)' },
  { key: 'bedrooms', required: false, description: 'Integer >= 0 (default 0)' },
  { key: 'bathrooms', required: false, description: 'Integer >= 0 (default 0)' },
  { key: 'parkingSpaces', required: false, description: 'Integer >= 0 (default 0)' },
  { key: 'floor', required: false, description: 'Integer, empty = unknown' },
  { key: 'area', required: false, description: 'Built area in m², number >= 0' },
  { key: 'lotSize', required: false, description: 'Lot size in m², number >= 0' },
  { key: 'terraceSize', required: false, description: 'Terrace size in m², number >= 0' },
  { key: 'yearBuilt', required: false, description: '1800–current year, empty = unknown' },
  { key: 'hasTerrace', required: false, description: 'YES / NO (default NO)' },
  { key: 'lat', required: false, description: 'Latitude, empty = unknown' },
  { key: 'lng', required: false, description: 'Longitude, empty = unknown' },
  { key: 'features', required: false, description: 'Semicolon-separated, e.g. Pool; Garage; Balcony' },
];

export const IMPORT_TEMPLATE_HEADERS: string[] = IMPORT_COLUMNS.map((c) => c.key);

/** Payload sent to POST /properties for each valid row. */
export interface PropertyImportPayload {
  title: string;
  price: number;
  type: string;
  address: string;
  city: string;
  country: string;
  description: string;
  listingType: string;
  condition: string;
  status: string;
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  floor: number | null;
  area: number;
  lotSize: number;
  terraceSize: number | null;
  yearBuilt: number | null;
  hasTerrace: boolean;
  lat: number | null;
  lng: number | null;
  features: string[];
}

export interface ValidatedImportRow {
  /** 1-based Excel row number (header = 1), for error messages. */
  excelRow: number;
  data: PropertyImportPayload;
  errors: string[];
  valid: boolean;
}
