import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ApiService } from '../../services/api';

interface Section {
  id: string;
  componentType: string;
  designVariant: string;
  name: string;
  config: any;
  content: any;
  styles: any;
  order?: number;
  isVisible?: boolean;
}

@Component({
  selector: 'app-section-editor',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatTabsModule, MatCheckboxModule
  ],
  template: `
    <div class="section-editor" *ngIf="section">
      <div class="editor-header">
        <h3>Edit: {{ section.name || section.componentType }}</h3>
        <button mat-icon-button (click)="close.emit()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-tab-group>
        <mat-tab label="Content">
          <div class="tab-content">
            <mat-form-field appearance="outline" *ngIf="section.content.title !== undefined">
              <mat-label>Title</mat-label>
              <input matInput [(ngModel)]="section.content.title">
            </mat-form-field>

            <mat-form-field appearance="outline" *ngIf="section.content.subtitle !== undefined">
              <mat-label>Subtitle</mat-label>
              <input matInput [(ngModel)]="section.content.subtitle">
            </mat-form-field>

            <mat-form-field appearance="outline" *ngIf="section.content.content !== undefined">
              <mat-label>Content</mat-label>
              <textarea matInput [(ngModel)]="section.content.content" rows="4"></textarea>
            </mat-form-field>

            <mat-form-field appearance="outline" *ngIf="section.content.primaryButtonText !== undefined">
              <mat-label>Primary Button Text</mat-label>
              <input matInput [(ngModel)]="section.content.primaryButtonText">
            </mat-form-field>

            <mat-form-field appearance="outline" *ngIf="section.content.primaryButtonUrl !== undefined">
              <mat-label>Primary Button URL</mat-label>
              <input matInput [(ngModel)]="section.content.primaryButtonUrl">
            </mat-form-field>

            <mat-form-field appearance="outline" *ngIf="section.content.secondaryButtonText !== undefined">
              <mat-label>Secondary Button Text</mat-label>
              <input matInput [(ngModel)]="section.content.secondaryButtonText">
            </mat-form-field>

            <mat-form-field appearance="outline" *ngIf="section.content.backgroundImage !== undefined">
              <mat-label>Background Image URL</mat-label>
              <input matInput [(ngModel)]="section.content.backgroundImage">
            </mat-form-field>

            <mat-form-field appearance="outline" *ngIf="section.content.image !== undefined">
              <mat-label>Image URL</mat-label>
              <input matInput [(ngModel)]="section.content.image">
            </mat-form-field>
          </div>
        </mat-tab>

        <mat-tab label="Design">
          <div class="tab-content">
            <mat-form-field appearance="outline">
              <mat-label>Design Variant</mat-label>
              <mat-select [(ngModel)]="section.designVariant">
                <mat-option *ngFor="let v of variants" [value]="v">{{v}}</mat-option>
              </mat-select>
            </mat-form-field>

            <div class="checkbox-field" *ngIf="section.config.showIcons !== undefined">
              <mat-checkbox [(ngModel)]="section.config.showIcons">Show Icons</mat-checkbox>
            </div>

            <div class="checkbox-field" *ngIf="section.config.showRating !== undefined">
              <mat-checkbox [(ngModel)]="section.config.showRating">Show Rating</mat-checkbox>
            </div>

            <div class="checkbox-field" *ngIf="section.config.showAvatar !== undefined">
              <mat-checkbox [(ngModel)]="section.config.showAvatar">Show Avatar</mat-checkbox>
            </div>

            <div class="checkbox-field" *ngIf="section.config.showContact !== undefined">
              <mat-checkbox [(ngModel)]="section.config.showContact">Show Contact</mat-checkbox>
            </div>

            <div class="checkbox-field" *ngIf="section.config.showSocial !== undefined">
              <mat-checkbox [(ngModel)]="section.config.showSocial">Show Social</mat-checkbox>
            </div>

            <div class="checkbox-field" *ngIf="section.config.showStats !== undefined">
              <mat-checkbox [(ngModel)]="section.config.showStats">Show Stats</mat-checkbox>
            </div>

            <div class="checkbox-field" *ngIf="section.config.overlay !== undefined">
              <mat-checkbox [(ngModel)]="section.config.overlay">Overlay Background</mat-checkbox>
            </div>

            <div class="checkbox-field" *ngIf="section.config.sticky !== undefined">
              <mat-checkbox [(ngModel)]="section.config.sticky">Sticky Header</mat-checkbox>
            </div>

            <mat-form-field appearance="outline" *ngIf="section.config.columns">
              <mat-label>Columns</mat-label>
              <mat-select [(ngModel)]="section.config.columns">
                <mat-option [value]="2">2 Columns</mat-option>
                <mat-option [value]="3">3 Columns</mat-option>
                <mat-option [value]="4">4 Columns</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </mat-tab>

        <mat-tab label="Settings">
          <div class="tab-content">
            <mat-form-field appearance="outline">
              <mat-label>Section Name</mat-label>
              <input matInput [(ngModel)]="section.name">
            </mat-form-field>

            <div class="checkbox-field">
              <mat-checkbox [(ngModel)]="section.isVisible">Visible</mat-checkbox>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>

      <div class="editor-actions">
        <button mat-button (click)="close.emit()">Cancel</button>
        <button mat-raised-button color="primary" (click)="saveSection()">Save Changes</button>
      </div>
    </div>
  `,
  styles: [`
    .section-editor { width: 400px; background: var(--bg-surface); border-left: 1px solid var(--border); height: 100%; display: flex; flex-direction: column; }
    .editor-header { display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid var(--border); }
    .editor-header h3 { margin: 0; font-size: 16px; font-weight: 600; }
    .tab-content { padding: 16px; display: flex; flex-direction: column; gap: 8px; max-height: 60vh; overflow-y: auto; }
    .checkbox-field { margin: 8px 0; }
    .editor-actions { display: flex; justify-content: flex-end; gap: 12px; padding: 16px; border-top: 1px solid var(--border); }
  `]
})
export class SectionEditorComponent {
  @Input() section: Section | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Section>();

  private api = inject(ApiService);
  variants: string[] = ['default'];

  saveSection() {
    if (this.section) {
      this.api.updateSection(this.section.id, this.section).subscribe({
        next: () => {
          this.save.emit(this.section!);
          this.close.emit();
        }
      });
    }
  }
}
