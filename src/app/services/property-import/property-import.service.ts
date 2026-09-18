import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import {
  IMPORT_COLUMNS,
  IMPORT_INSTRUCTIONS_SHEET,
  IMPORT_MAX_FILE_MB,
  IMPORT_MAX_ROWS,
  IMPORT_PROPERTY_TYPES,
  IMPORT_SHEET_NAME,
  IMPORT_TEMPLATE_FILENAME,
  IMPORT_TEMPLATE_HEADERS,
  ValidatedImportRow,
} from './property-import-columns';
import {
  findMissingHeaders,
  normalizeHeader,
  toNormalizedRow,
  validateImportRow,
} from './property-import-validator';

export interface ParsedImportFile {
  fileName: string;
  headers: string[];
  missingHeaders: string[];
  rows: ValidatedImportRow[];
  totalDataRows: number;
  truncated: boolean;
}

const EXAMPLE_ROW: Record<string, unknown> = {
  title: 'Sunny 2BR apartment in Marina',
  price: 250000,
  type: 'Apartment',
  address: '123 Marina Walk',
  city: 'Dubai',
  country: 'UAE',
  description: 'Bright apartment with sea view',
  listingType: 'Sale',
  condition: 'Used',
  status: 'Available',
  bedrooms: 2,
  masterBedrooms: 1,
  bathrooms: 2,
  parkingSpaces: 1,
  floor: 5,
  area: 120,
  lotSize: 0,
  terraceSize: '',
  cellarSize: '',
  yearBuilt: 2015,
  hasTerrace: 'NO',
  hasCellar: 'NO',
  lat: '',
  lng: '',
  features: 'Balcony; Pool; Gym',
  project: '',
};

@Injectable({ providedIn: 'root' })
export class PropertyImportService {
  /**
   * Generate the predefined .xlsx template in the browser and trigger download.
   * Sheet 1 "Properties": header + example row. Sheet 2 "Instructions".
   */
  downloadTemplate(): void {
    const header = IMPORT_TEMPLATE_HEADERS;
    const example = IMPORT_TEMPLATE_HEADERS.map((h) => EXAMPLE_ROW[h] ?? '');

    const propsSheet = XLSX.utils.aoa_to_sheet([header, example]);
    propsSheet['!cols'] = IMPORT_TEMPLATE_HEADERS.map(() => ({ wch: 18 }));

    const instructions: unknown[][] = [
      ['Property import — instructions'],
      [''],
      ['1. Fill one property per row in the "Properties" sheet. Do not rename headers.'],
      ['2. Required columns: title, price, type, address, city, country.'],
      [`3. type must be one of: ${IMPORT_PROPERTY_TYPES.join(', ')}.`],
      ['4. listingType: Sale or Rent (empty = Sale). condition: Used or New (empty = Used).'],
      ['5. status: Available or Reserved (empty = Available). Sold/Rented/Lost cannot be imported.'],
      ['6. Numbers (price, area, bedrooms, ...) must be >= 0. hasTerrace / hasCellar: YES or NO.'],
      ['7. features: separate with semicolons, e.g. Pool; Garage; Balcony.'],
      ['8. project: optional building/development name — units sharing a name are grouped together.'],
      [`9. Maximum ${IMPORT_MAX_ROWS} rows per import. Photos and sellers are added after import.`],
      [''],
      ['Column reference'],
      ...IMPORT_COLUMNS.map((c) => [c.key + (c.required ? ' *' : ''), c.description]),
    ];
    const helpSheet = XLSX.utils.aoa_to_sheet(instructions);
    helpSheet['!cols'] = [{ wch: 34 }, { wch: 60 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, propsSheet, IMPORT_SHEET_NAME);
    XLSX.utils.book_append_sheet(wb, helpSheet, IMPORT_INSTRUCTIONS_SHEET);
    XLSX.writeFile(wb, IMPORT_TEMPLATE_FILENAME);
  }

  /** Read an .xlsx/.xls/.csv File, validate every row, return preview model. */
  async parseFile(file: File): Promise<ParsedImportFile> {
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > IMPORT_MAX_FILE_MB) {
      throw new Error(`File is ${sizeMb.toFixed(1)} MB — maximum is ${IMPORT_MAX_FILE_MB} MB.`);
    }

    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const sheetName = wb.SheetNames.includes(IMPORT_SHEET_NAME)
      ? IMPORT_SHEET_NAME
      : wb.SheetNames[0];
    if (!sheetName) throw new Error('The workbook contains no sheets.');

    const sheet = wb.Sheets[sheetName];
    const grid: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      blankrows: false,
    });

    if (grid.length === 0) throw new Error('The sheet is empty. Use "Download Template" first.');

    const rawHeaders = (grid[0] as unknown[]).map(String);
    const headers = rawHeaders.map(normalizeHeader);
    const missingHeaders = findMissingHeaders(headers);
    if (missingHeaders.length > 0) {
      throw new Error(
        `Missing required column(s): ${missingHeaders.join(', ')}. Please use the predefined template.`
      );
    }

    const dataGrid = grid.slice(1).filter((r) => r.some((c) => String(c ?? '').trim() !== ''));
    if (dataGrid.length === 0) throw new Error('No data rows found — fill at least one property row.');
    const truncated = dataGrid.length > IMPORT_MAX_ROWS;
    const limited = truncated ? dataGrid.slice(0, IMPORT_MAX_ROWS) : dataGrid;

    const rows = limited.map((cells, i) =>
      validateImportRow(toNormalizedRow(headers, cells), i + 2)
    );

    return {
      fileName: file.name,
      headers,
      missingHeaders: [],
      rows,
      totalDataRows: dataGrid.length,
      truncated,
    };
  }

  /** Re-validate a row after the user edited it in the fix-up popup. */
  revalidate(row: ValidatedImportRow): ValidatedImportRow {
    const raw: Record<string, unknown> = {
      title: row.data.title,
      price: row.data.price,
      type: row.data.type,
      address: row.data.address,
      city: row.data.city,
      country: row.data.country,
      description: row.data.description,
      listingtype: row.data.listingType,
      condition: row.data.condition,
      status: row.data.status,
      bedrooms: row.data.bedrooms,
      masterbedrooms: (row.data as any).masterBedrooms ?? 0,
      bathrooms: row.data.bathrooms,
      parkingspaces: row.data.parkingSpaces,
      floor: row.data.floor ?? '',
      area: row.data.area,
      lotsize: row.data.lotSize,
      terracesize: row.data.terraceSize ?? '',
      cellarsize: row.data.cellarSize ?? '',
      yearbuilt: row.data.yearBuilt ?? '',
      hasterrace: row.data.hasTerrace ? 'YES' : 'NO',
      hascellar: row.data.hasCellar ? 'YES' : 'NO',
      lat: row.data.lat ?? '',
      lng: row.data.lng ?? '',
      features: row.data.features.join('; '),
      project: (row.data as any).project ?? '',
    };
    return validateImportRow(raw, row.excelRow);
  }
}
