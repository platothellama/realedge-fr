import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DocumentManagerComponent } from '../../components/document-manager/document-manager';

@Component({
  selector: 'app-document-manager-page',
  standalone: true,
  imports: [CommonModule, DocumentManagerComponent],
  template: `
    <div class="page-container">
      <app-document-manager [documentId]="documentId"></app-document-manager>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px;
    }
  `]
})
export class DocumentManagerPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  documentId?: string;

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.documentId = params['id'];
    });
  }
}
