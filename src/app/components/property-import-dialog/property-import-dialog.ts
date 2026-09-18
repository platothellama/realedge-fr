import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../services/api';
import {
  IMPORT_PROPERTY_TYPES,
  ValidatedImportRow,
} from '../../services/property-import/property-import-columns';
import { PropertyImportService } from '../../services/property-import/property-import.service';

type Stage = 'idle' | 'parsing' | 'preview' | 'importing' | 'done';

interface FailedRow {
  excelRow: number;
  title: string;
  message: string;
}

@Component({
  selector: 'app-property-import-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './property-import-dialog.html',
  styleUrl: './property-import-dialog.css',
})
export class PropertyImportDialogComponent {
  stage: Stage = 'idle';
  parseError = '';
  fileName = '';
  truncated = false;
  totalDataRows = 0;
  rows: ValidatedImportRow[] = [];

  importing = false;
  importedCount = 0;
  failed: FailedRow[] = [];
  doneImporting = false;

  readonly propertyTypes = [...IMPORT_PROPERTY_TYPES];
  showValidOnly = false;
  showInvalidOnly = false;

  constructor(
    private dialogRef: MatDialogRef<PropertyImportDialogComponent>,
    private importer: PropertyImportService,
    private api: ApiService
  ) {}

  get validRows(): ValidatedImportRow[] {
    return this.rows.filter((r) => r.valid);
  }

  get invalidRows(): ValidatedImportRow[] {
    return this.rows.filter((r) => !r.valid);
  }

  get visibleRows(): ValidatedImportRow[] {
    if (this.showValidOnly) return this.validRows;
    if (this.showInvalidOnly) return this.invalidRows;
    return this.rows;
  }

  get progressPct(): number {
    const total = this.validRows.length;
    if (total === 0) return 0;
    return Math.round(((this.importedCount + this.failed.length) / total) * 100);
  }

  downloadTemplate(): void {
    this.importer.downloadTemplate();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.stage = 'parsing';
    this.parseError = '';
    this.doneImporting = false;
    this.failed = [];
    this.importedCount = 0;
    try {
      const parsed = await this.importer.parseFile(file);
      this.fileName = parsed.fileName;
      this.rows = parsed.rows;
      this.truncated = parsed.truncated;
      this.totalDataRows = parsed.totalDataRows;
      this.stage = 'preview';
    } catch (err) {
      this.stage = 'idle';
      this.parseError = err instanceof Error ? err.message : 'Could not read this file.';
    }
  }

  /** Re-validate after the user fixes a cell in the fix-up popup table. */
  onCellEdited(row: ValidatedImportRow): void {
    const updated = this.importer.revalidate(row);
    row.errors = updated.errors;
    row.valid = updated.valid;
    row.data = updated.data;
  }

  removeRow(row: ValidatedImportRow): void {
    this.rows = this.rows.filter((r) => r !== row);
    if (this.rows.length === 0) this.stage = 'idle';
  }

  downloadErrorsCsv(): void {
    const lines = ['excel_row,title,errors'];
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    for (const r of this.invalidRows) {
      lines.push(`${r.excelRow},${esc(r.data.title || '(untitled)')},${esc(r.errors.join(' | '))}`);
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'property-import-errors.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async importValid(): Promise<void> {
    if (this.importing || this.validRows.length === 0) return;
    this.stage = 'importing';
    this.importing = true;
    this.failed = [];
    this.importedCount = 0;

    // Resolve optional project names to ids once (units sharing a name are
    // grouped into one project; avoids creating duplicates per row).
    const projectCache = new Map<string, string>();
    try {
      const existing = await firstValueFrom(this.api.getProjects());
      for (const p of (Array.isArray(existing) ? existing : [])) {
        projectCache.set(String(p.name || '').trim().toLowerCase(), p.id);
      }
    } catch { /* project grouping is best-effort; rows still import standalone */ }
    const resolveProjectId = async (name: string, city: string): Promise<string | null> => {
      const key = name.trim().toLowerCase();
      if (!key) return null;
      if (projectCache.has(key)) return projectCache.get(key)!;
      try {
        const created = await firstValueFrom(this.api.createProject({ name: name.trim(), city: city?.trim() || null }));
        const id = (created as any)?.id;
        if (id) projectCache.set(key, id);
        return id || null;
      } catch { return null; }
    };

    // Sequential creates: reuses POST /properties (auth, PriceHistory, validation).
    for (const row of this.validRows) {
      try {
        const payload: any = { ...row.data };
        const projectName = String((payload as any).project || '').trim();
        delete (payload as any).project;
        if (projectName) {
          const pid = await resolveProjectId(projectName, payload.city);
          if (pid) payload.projectId = pid;
        }
        await firstValueFrom(this.api.createProperty(payload));
        this.importedCount++;
      } catch (err: any) {
        const message =
          err?.error?.message || err?.message || 'Server rejected this row.';
        this.failed.push({
          excelRow: row.excelRow,
          title: row.data.title || '(untitled)',
          message: String(message),
        });
      }
    }

    this.importing = false;
    this.doneImporting = true;
    this.stage = 'done';
  }

  close(): void {
    // Parent refreshes its list when at least one property was created.
    this.dialogRef.close({ created: this.importedCount });
  }
}
