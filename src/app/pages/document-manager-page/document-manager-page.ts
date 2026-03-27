import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentManagerComponent } from '../../components/document-manager/document-manager';

@Component({
  selector: 'app-document-manager-page',
  standalone: true,
  imports: [CommonModule, DocumentManagerComponent],
  template: `
    <div class="page-container">
      <app-document-manager></app-document-manager>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px;
    }
  `]
})
export class DocumentManagerPageComponent {}
