import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../services/api';
import { DocumentUploadFormComponent } from '../document-upload-form/document-upload-form';

@Component({
  selector: 'app-document-manager',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatMenuModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './document-manager.html',
  styleUrl: './document-manager.css'
})
export class DocumentManagerComponent implements OnInit {
  @Input() propertyId?: string;
  @Input() dealId?: string;
  @Input() dealStage?: string;
  @Input() keyDocsOnly = false;

  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  documents: any[] = [];
  loading = true;

  keyDocumentTypes = ['Title Deed', 'Floor Plan', 'Property Photos', 'Ownership Proof'];
  dealRequiredDocs = ['Reservation Form', 'Contract', 'Payment Receipt'];

  ngOnInit(): void {
    this.fetchDocuments();
  }

  fetchDocuments() {
    const params: any = {};
    if (this.propertyId) params.propertyId = this.propertyId;
    if (this.dealId) params.dealId = this.dealId;

    this.api.getDocuments(params).subscribe({
      next: (res: any) => {
        const allDocs = Array.isArray(res) ? res : (res?.data || []);
        this.documents = allDocs;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to fetch documents', err);
        this.loading = false;
        this.documents = [];
      }
    });
  }

  getDealDocuments() {
    let docs = this.documents.filter(d => !d.isPropertyDocument && d.dealId);
    if (this.keyDocsOnly) {
      docs = docs.filter(d => this.dealRequiredDocs.includes(d.type));
    }
    return docs;
  }

  getPropertyDocuments() {
    let docs = this.documents.filter(d => d.isPropertyDocument || (d.propertyId && !d.dealId && this.dealId));
    if (this.keyDocsOnly) {
      docs = docs.filter(d => this.keyDocumentTypes.includes(d.type));
    }
    return docs;
  }

  getLinkedPropertyDocuments() {
    return this.getPropertyDocuments();
  }

  getDealReadiness() {
    const dealDocs = this.documents.filter(d => !d.isPropertyDocument && d.dealId);
    const required = this.getRequiredDocsForStage();
    
    return required.map(docType => {
      const found = dealDocs.find(d => d.type === docType);
      return {
        type: docType,
        status: found ? 'uploaded' : 'missing',
        document: found
      };
    });
  }

  getRequiredDocsForStage(): string[] {
    switch (this.dealStage) {
      case 'Reserved':
        return ['Reservation Form'];
      case 'Contract Signed':
        return ['Reservation Form', 'Contract'];
      case 'Payment':
        return ['Reservation Form', 'Contract', 'Payment Receipt'];
      case 'Closed':
        return ['Reservation Form', 'Contract', 'Payment Receipt'];
      default:
        return [];
    }
  }

  isDealReady(): boolean {
    const readiness = this.getDealReadiness();
    return readiness.length === 0 || readiness.every(r => r.status === 'uploaded');
  }

  getMissingDocs(): string[] {
    return this.getDealReadiness()
      .filter(r => r.status === 'missing')
      .map(r => r.type);
  }

  openUploadForm(isNewVersion = false, docId?: string) {
    const dialogRef = this.dialog.open(DocumentUploadFormComponent, {
      width: '600px',
      data: { 
        propertyId: this.propertyId, 
        dealId: this.dealId,
        isNewVersion,
        docId
      }
    });

    dialogRef.afterClosed().subscribe(formData => {
      if (formData) {
        if (isNewVersion && docId) {
          this.api.addDocumentVersion(docId, formData).subscribe({
            next: () => {
              this.snackBar.open('New version uploaded', 'Close', { duration: 3000 });
              this.fetchDocuments();
            },
            error: (err) => this.snackBar.open('Upload failed', 'Close', { duration: 3000 })
          });
        } else {
          this.api.uploadDocument(formData).subscribe({
            next: (res: any) => {
              const count = Array.isArray(res) ? res.length : 1;
              this.snackBar.open(`${count} document(s) uploaded successfully`, 'Close', { duration: 3000 });
              this.fetchDocuments();
            },
            error: (err) => this.snackBar.open('Upload failed', 'Close', { duration: 3000 })
          });
        }
      }
    });
  }

  downloadDocument(doc: any) {
    const version = doc.versions[0]; // Latest version
    if (version) {
      window.open(`https://realedge-frontend-production.up.railway.app/tend-production.up.railway.app//uploads/${version.fileUrl}`, '_blank');
    }
  }

  signDocument(doc: any, signerType?: string) {
    const body = signerType ? { signerType } : {};
    this.api.signDocument(doc.id, body).subscribe({
      next: () => {
        this.snackBar.open('Document signed successfully', 'Close', { duration: 3000 });
        this.fetchDocuments();
      },
      error: (err) => this.snackBar.open('Signature failed', 'Close', { duration: 3000 })
    });
  }

  deleteDocument(doc: any) {
    if (confirm('Are you sure you want to delete this document?')) {
      this.api.deleteDocument(doc.id).subscribe({
        next: () => {
          this.snackBar.open('Document deleted', 'Close', { duration: 3000 });
          this.fetchDocuments();
        },
        error: (err) => this.snackBar.open('Delete failed', 'Close', { duration: 3000 })
      });
    }
  }

  generateSignatureLink(doc: any, signer: any) {
    this.api.generateSignatureLink(doc.id, {
      signerType: signer.type,
      signerEmail: signer.email || signer.signerEmail,
      signerName: signer.name || signer.signerName
    }).subscribe({
      next: (res: any) => {
        if (res.emailSent) {
          this.snackBar.open(`Signature link sent to ${res.signerEmail}`, 'Close', { duration: 5000 });
        } else {
          this.copyToClipboard(res.signUrl);
          this.snackBar.open('Signature link copied to clipboard', 'Close', { duration: 3000 });
        }
        this.fetchDocuments();
      },
      error: (err) => this.snackBar.open('Failed to generate link', 'Close', { duration: 3000 })
    });
  }

  copySignatureLink(doc: any) {
    const signer = doc.signers && doc.signers.length > 0 
      ? doc.signers.find((s: any) => s.status !== 'signed') || doc.signers[0]
      : null;
    
    if (signer && signer.email) {
      this.api.generateSignatureLink(doc.id, {
        signerType: signer.type,
        signerEmail: signer.email
      }).subscribe({
        next: (res: any) => {
          this.copyToClipboard(res.signUrl);
          this.snackBar.open('Signature link copied to clipboard', 'Close', { duration: 3000 });
        },
        error: (err) => this.snackBar.open('Failed to generate link', 'Close', { duration: 3000 })
      });
    } else {
      this.snackBar.open('No signer email configured', 'Close', { duration: 3000 });
    }
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).catch(err => {
      console.error('Copy failed', err);
    });
  }

  viewSignatureCertificate(doc: any) {
    this.api.getSignatureCertificate(doc.id).subscribe({
      next: (res: any) => {
        const certWindow = window.open('', '_blank');
        if (certWindow) {
          certWindow.document.write(this.generateCertificateHtml(res));
          certWindow.document.close();
        }
      },
      error: (err) => this.snackBar.open('Failed to load certificate', 'Close', { duration: 3000 })
    });
  }

  private generateCertificateHtml(cert: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Signature Certificate - ${cert.document.title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { color: #1e293b; border-bottom: 2px solid #6366f1; padding-bottom: 10px; }
          .section { margin: 20px 0; padding: 20px; background: #f8fafc; border-radius: 8px; }
          .signature { display: flex; gap: 20px; margin: 10px 0; }
          .signature-item { flex: 1; padding: 15px; background: white; border-radius: 8px; }
          .label { font-size: 12px; color: #64748b; }
          .value { font-size: 14px; color: #1e293b; font-weight: bold; }
          .hash { font-family: monospace; font-size: 11px; word-break: break-all; color: #475569; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          th { background: #f1f5f9; }
        </style>
      </head>
      <body>
        <h1>📜 Digital Signature Certificate</h1>
        <div class="section">
          <h2>Document</h2>
          <p><strong>Title:</strong> ${cert.document.title}</p>
          <p><strong>Type:</strong> ${cert.document.type}</p>
          <p><strong>Status:</strong> ${cert.document.status}</p>
        </div>
        <div class="section">
          <h2>File Version</h2>
          <p><strong>File:</strong> ${cert.version?.fileName || 'N/A'}</p>
          <p><strong>Size:</strong> ${cert.version ? (cert.version.fileSize / 1024).toFixed(1) + ' KB' : 'N/A'}</p>
          <p><strong>Version:</strong> ${cert.version?.versionNumber || 'N/A'}</p>
        </div>
        <div class="section">
          <h2>Signatures</h2>
          <table>
            <thead>
              <tr>
                <th>Signer</th>
                <th>Signed At</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              ${cert.signatures.map((s: any) => `
                <tr>
                  <td>${s.signerName} (${s.signerType})</td>
                  <td>${new Date(s.signedAt).toLocaleString()}</td>
                  <td>${s.ipAddress || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div class="section">
          <h2>Security Hashes</h2>
          ${cert.signatures.map((s: any, i: number) => `
            <div class="signature-item">
              <p class="label">Signature ${i + 1} - ${s.signerName}</p>
              <p class="label">Document Hash:</p>
              <p class="hash">${s.documentHash || 'N/A'}</p>
              <p class="label">Signature Hash:</p>
              <p class="hash">${s.signatureHash || 'N/A'}</p>
            </div>
          `).join('')}
        </div>
        <div class="section">
          <p><strong>Certificate Generated:</strong> ${new Date(cert.generatedAt).toLocaleString()}</p>
          <p style="font-size: 12px; color: #64748b;">
            This certificate proves that the document was digitally signed. 
            The hashes ensure document integrity and signature authenticity.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  getIconForType(type: string): string {
    switch (type) {
      case 'Title Deed': return 'article';
      case 'Floor Plan': return 'grid_on';
      case 'Property Photos': return 'photo_library';
      case 'Ownership Proof': return 'verified_user';
      case 'Reservation Form': return 'book_online';
      case 'Sales Agreement': return 'handshake';
      case 'Contract': return 'description';
      case 'Payment Receipt': return 'receipt_long';
      case 'ID / Passport': return 'badge';
      case 'Proof of Funds': return 'account_balance';
      default: return 'insert_drive_file';
    }
  }
}
