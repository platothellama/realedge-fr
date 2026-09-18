import {
  IMPORT_CONDITIONS,
  IMPORT_LISTING_TYPES,
  IMPORT_PROPERTY_TYPES,
  IMPORT_REQUIRED_KEYS,
  IMPORT_STATUSES,
  PropertyImportPayload,
  ValidatedImportRow,
} from './property-import-columns';

/** Normalize an Excel header cell: trim + lowercase. */
export function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function asText(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function isBlank(value: unknown): boolean {
  return asText(value) === '';
}

function toNumber(value: unknown): number | null {
  if (isBlank(value)) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const n = Number(String(value).trim().replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

/** Accepts YES/NO, TRUE/FALSE, 1/0, Y/N (case-insensitive). Null = empty cell. */
export function parseYesNo(value: unknown): boolean | null | 'invalid' {
  if (isBlank(value)) return null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
    return 'invalid';
  }
  const s = String(value).trim().toLowerCase();
  if (['yes', 'y', 'true', '1'].includes(s)) return true;
  if (['no', 'n', 'false', '0'].includes(s)) return false;
  return 'invalid';
}

/** "Pool; Garage, Balcony" -> ["Pool", "Garage", "Balcony"] (deduped, order kept). */
export function splitFeatures(value: unknown): string[] {
  if (isBlank(value)) return [];
  const parts = String(value)
    .split(/[;,]/)
    .map((p) => p.trim())
    .filter((p) => p !== '');
  return [...new Set(parts)];
}

function matchEnum(value: string, allowed: readonly string[]): string | null {
  const lower = value.toLowerCase();
  return allowed.find((a) => a.toLowerCase() === lower) ?? null;
}

export type RawImportRow = Record<string, unknown>;

/**
 * Validate one parsed Excel row (keys already normalized to lowercase).
 * excelRow is the 1-based Excel row number used in error messages.
 * Missing optional fields fall back to backend defaults.
 */
export function validateImportRow(raw: RawImportRow, excelRow: number): ValidatedImportRow {
  const errors: string[] = [];
  const get = (key: string): unknown => raw[key];

  // ---- Required text fields ----
  const title = asText(get('title'));
  const address = asText(get('address'));
  const city = asText(get('city'));
  const country = asText(get('country'));
  if (!title) errors.push('Title is required.');
  if (!address) errors.push('Street address is required.');
  if (!city) errors.push('City is required.');
  if (!country) errors.push('Country is required.');

  // ---- Price ----
  const priceRaw = get('price');
  const price = toNumber(priceRaw);
  if (isBlank(priceRaw)) {
    errors.push('Price is required.');
  } else if (price === null || price < 0) {
    errors.push(`Price must be a number >= 0 (got "${asText(priceRaw)}").`);
  }

  // ---- Type (required enum) ----
  const typeRaw = asText(get('type'));
  let type = 'Apartment';
  if (!typeRaw) {
    errors.push('Type is required (Apartment, House, Villa, Office, Land, Commercial).');
  } else {
    const matched = matchEnum(typeRaw, IMPORT_PROPERTY_TYPES);
    if (!matched) {
      errors.push(
        `Type must be one of: ${IMPORT_PROPERTY_TYPES.join(', ')} (got "${typeRaw}").`
      );
    } else {
      type = matched;
    }
  }

  // ---- Optional enums (default when blank, error when unknown) ----
  let listingType = 'Sale';
  const listingRaw = asText(get('listingtype'));
  if (listingRaw) {
    const matched = matchEnum(listingRaw, IMPORT_LISTING_TYPES);
    if (!matched) errors.push(`Listing type must be Sale or Rent (got "${listingRaw}").`);
    else listingType = matched;
  }

  let condition = 'Used';
  const conditionRaw = asText(get('condition'));
  if (conditionRaw) {
    const matched = matchEnum(conditionRaw, IMPORT_CONDITIONS);
    if (!matched) errors.push(`Condition must be Used or New (got "${conditionRaw}").`);
    else condition = matched;
  }

  let status = 'Available';
  const statusRaw = asText(get('status'));
  if (statusRaw) {
    const matched = matchEnum(statusRaw, IMPORT_STATUSES);
    if (!matched) {
      errors.push(
        `Status must be Available or Reserved for import (got "${statusRaw}").`
      );
    } else {
      status = matched;
    }
  }

  // ---- Optional integers >= 0 ----
  const intField = (key: string, label: string): number => {
    const v = get(key);
    if (isBlank(v)) return 0;
    const n = toNumber(v);
    if (n === null || !Number.isInteger(n) || n < 0) {
      errors.push(`${label} must be a whole number >= 0 (got "${asText(v)}").`);
      return 0;
    }
    return n;
  };
  const bedrooms = intField('bedrooms', 'Bedrooms');
  const masterBedrooms = intField('masterbedrooms', 'Master bedrooms');
  const bathrooms = intField('bathrooms', 'Bathrooms');
  const balconies = intField('balconies', 'Balconies');
  const parkingSpaces = intField('parkingspaces', 'Parking spaces');
  if (masterBedrooms > bedrooms) {
    errors.push(`Master bedrooms (${masterBedrooms}) cannot exceed total bedrooms (${bedrooms}).`);
  }

  let floor: number | null = null;
  const floorRaw = get('floor');
  if (!isBlank(floorRaw)) {
    const n = toNumber(floorRaw);
    if (n === null || !Number.isInteger(n)) {
      errors.push(`Floor must be a whole number (got "${asText(floorRaw)}").`);
    } else {
      floor = n;
    }
  }

  // ---- Optional decimals >= 0 ----
  const numField = (key: string, label: string, def: number): number => {
    const v = get(key);
    if (isBlank(v)) return def;
    const n = toNumber(v);
    if (n === null || n < 0) {
      errors.push(`${label} must be a number >= 0 (got "${asText(v)}").`);
      return def;
    }
    return n;
  };
  const area = numField('area', 'Area', 0);
  const lotSize = numField('lotsize', 'Lot size', 0);

  let terraceSize: number | null = null;
  const terraceRaw = get('terracesize');
  if (!isBlank(terraceRaw)) {
    const n = toNumber(terraceRaw);
    if (n === null || n < 0) {
      errors.push(`Terrace size must be a number >= 0 (got "${asText(terraceRaw)}").`);
    } else {
      terraceSize = n;
    }
  }

  let cellarSize: number | null = null;
  const cellarRaw = get('cellarsize');
  if (!isBlank(cellarRaw)) {
    const n = toNumber(cellarRaw);
    if (n === null || n < 0) {
      errors.push(`Cellar size must be a number >= 0 (got "${asText(cellarRaw)}").`);
    } else {
      cellarSize = n;
    }
  }

  // ---- Year built ----
  let yearBuilt: number | null = null;
  const yearRaw = get('yearbuilt');
  if (!isBlank(yearRaw)) {
    const n = toNumber(yearRaw);
    const currentYear = new Date().getFullYear();
    if (n === null || !Number.isInteger(n) || n < 1800 || n > currentYear) {
      errors.push(`Year built must be between 1800 and ${currentYear} (got "${asText(yearRaw)}").`);
    } else {
      yearBuilt = n;
    }
  }

  // ---- Terrace flag ----
  let hasTerrace = false;
  const terraceFlag = parseYesNo(get('hasterrace'));
  if (terraceFlag === 'invalid') {
    errors.push(`HasTerrace must be YES or NO (got "${asText(get('hasterrace'))}").`);
  } else if (terraceFlag !== null) {
    hasTerrace = terraceFlag;
  }

  // ---- Cellar flag ----
  let hasCellar = false;
  const cellarFlag = parseYesNo(get('hascellar'));
  if (cellarFlag === 'invalid') {
    errors.push(`HasCellar must be YES or NO (got "${asText(get('hascellar'))}").`);
  } else if (cellarFlag !== null) {
    hasCellar = cellarFlag;
  }

  // Sizes only make sense when the feature exists — flag mismatches are
  // rejected so imports don't silently store sizes for missing features.
  if (!hasTerrace && terraceSize !== null) {
    errors.push('Terrace size is set but HasTerrace is NO — set HasTerrace to YES or clear Terrace size.');
  }
  if (!hasCellar && cellarSize !== null) {
    errors.push('Cellar size is set but HasCellar is NO — set HasCellar to YES or clear Cellar size.');
  }

  // ---- Coordinates ----
  let lat: number | null = null;
  let lng: number | null = null;
  const latRaw = get('lat');
  const lngRaw = get('lng');
  if (!isBlank(latRaw)) {
    const n = toNumber(latRaw);
    if (n === null || n < -90 || n > 90) {
      errors.push(`Latitude must be between -90 and 90 (got "${asText(latRaw)}").`);
    } else {
      lat = n;
    }
  }
  if (!isBlank(lngRaw)) {
    const n = toNumber(lngRaw);
    if (n === null || n < -180 || n > 180) {
      errors.push(`Longitude must be between -180 and 180 (got "${asText(lngRaw)}").`);
    } else {
      lng = n;
    }
  }

  const features = splitFeatures(get('features'));

  // Optional project grouping — free text, resolved/created on import.
  const projectRaw = asText(get('project'));
  const project = projectRaw ? projectRaw.slice(0, 255) : '';

  const data: PropertyImportPayload = {
    title,
    price: price ?? 0,
    type,
    address,
    city,
    country,
    description: asText(get('description')),
    listingType,
    condition,
    status,
    bedrooms,
    masterBedrooms,
    bathrooms,
    balconies,
    parkingSpaces,
    floor,
    area,
    lotSize,
    terraceSize,
    cellarSize,
    yearBuilt,
    hasTerrace,
    hasCellar,
    lat,
    lng,
    features,
    project,
  };

  return { excelRow, data, errors, valid: errors.length === 0 };
}

/** Check that all required template columns are present in the uploaded header. */
export function findMissingHeaders(normalizedHeaders: string[]): string[] {
  return [...IMPORT_REQUIRED_KEYS].filter((k) => !normalizedHeaders.includes(k));
}

/** Build a normalized row object from a raw worksheet array-row + header list. */
export function toNormalizedRow(headerKeys: string[], cellValues: unknown[]): RawImportRow {
  const row: RawImportRow = {};
  headerKeys.forEach((key, i) => {
    row[key] = cellValues[i];
  });
  return row;
}
