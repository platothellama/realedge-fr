import * as XLSX from 'xlsx';
import { IMPORT_TEMPLATE_HEADERS } from './property-import-columns';
import { PropertyImportService } from './property-import.service';

function toFile(rows: unknown[][]): File {
  const sheet = XLSX.utils.aoa_to_sheet([IMPORT_TEMPLATE_HEADERS, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Properties');
  const bytes = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const buffer = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes as ArrayBuffer);
  return new File([buffer as BlobPart], 'import.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

describe('PropertyImportService', () => {
  const service = new PropertyImportService();

  it('parses a template-shaped workbook into valid + invalid rows', async () => {
    const file = toFile([
      // valid row (headers: ... bedrooms, masterBedrooms, bathrooms, balconies, parkingSpaces, ...)
      ['Cottage', 100000, 'House', '1 Lane', 'Cairo', 'Egypt', '', 'Sale', 'Used', 'Available',
        3, 1, 2, 1, 1, '', 150, 200, '', '', 2000, 'YES', 'NO', '', '', 'Garden; Garage', ''],
      // invalid row: missing title + bad type
      ['', 50000, 'Castle', '2 Lane', 'Cairo', 'Egypt'],
    ]);

    const parsed = await service.parseFile(file);
    expect(parsed.rows.length).toBe(2);
    expect(parsed.missingHeaders).toEqual([]);

    const [ok, bad] = parsed.rows;
    expect(ok.valid).toBe(true);
    expect(ok.data.features).toEqual(['Garden', 'Garage']);
    expect(ok.data.hasTerrace).toBe(true);
    expect(ok.data.masterBedrooms).toBe(1);
    expect(ok.data.balconies).toBe(1);
    expect(bad.valid).toBe(false);
    expect(bad.errors.some((e) => e.includes('Title is required.'))).toBe(true);
    expect(bad.errors.some((e) => e.includes('Type must be one of'))).toBe(true);
  });

  it('rejects workbooks missing required columns', async () => {
    const sheet = XLSX.utils.aoa_to_sheet([['title', 'price'], ['A', 1]]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, 'Properties');
    const bytes = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const file = new File([new Uint8Array(bytes as ArrayBuffer) as BlobPart], 'bad.xlsx');
    await expect(service.parseFile(file)).rejects.toThrow(/Missing required column/);
  });

  it('revalidates a fixed row back to valid', async () => {
    const file = toFile([['', 50000, 'House', '2 Lane', 'Cairo', 'Egypt']]);
    const parsed = await service.parseFile(file);
    expect(parsed.rows[0].valid).toBe(false);
    parsed.rows[0].data.title = 'Fixed title';
    expect(service.revalidate(parsed.rows[0]).valid).toBe(true);
  });
});
