import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApiService } from '../../services/api';
import { DocumentUploadFormComponent } from '../../components/document-upload-form/document-upload-form';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatMenuModule,
    MatTooltipModule,
    FormsModule,
    MatDialogModule
  ],
  templateUrl: './documents.html',
  styleUrl: './documents.css'
})
export class DocumentsPageComponent implements OnInit {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  documents: any[] = [];
  loading = true;
  searchQuery = '';
  filterType = 'All';

  documentTypes = ['All', 'Title Deed', 'Floor Plan', 'Property Photos', 'Ownership Proof', 'Reservation Form', 'Sales Agreement', 'Contract', 'Payment Receipt', 'ID / Passport', 'Proof of Funds', 'Other'];

  ngOnInit() {
    this.fetchDocuments();
  }

  fetchDocuments() {
    this.loading = true;
    this.api.getDocuments({}).subscribe({
      next: (res: any) => {
        this.documents = Array.isArray(res) ? res : (res?.data || []);
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to fetch documents', err);
        this.loading = false;
        this.documents = [];
      }
    });
  }

  get filteredDocuments() {
    let result = this.documents;

    if (this.filterType !== 'All') {
      result = result.filter(d => d.type === this.filterType);
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(d => 
        d.title?.toLowerCase().includes(q) || 
        d.type?.toLowerCase().includes(q)
      );
    }

    return result;
  }

  openUploadForm() {
    const dialogRef = this.dialog.open(DocumentUploadFormComponent, {
      width: '600px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(formData => {
      if (formData) {
        this.api.uploadDocument(formData).subscribe({
          next: (res: any) => {
            const count = Array.isArray(res) ? res.length : 1;
            this.snackBar.open(`${count} document(s) uploaded successfully`, 'Close', { duration: 3000 });
            this.fetchDocuments();
          },
          error: (err) => this.snackBar.open('Upload failed', 'Close', { duration: 3000 })
        });
      }
    });
  }

  downloadDocument(doc: any) {
    const version = doc.versions?.[0];
    if (version?.fileUrl) {
      window.open(`https://realedge-frontend-production.up.railway.app/uploads/${version.fileUrl}`, '_blank');
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
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          th { background: #f1f5f9; }
        </style>
      </head>
      <body>
        <h1>Digital Signature Certificate</h1>
        <div class="section">
          <h2>Document</h2>
          <p><strong>Title:</strong> ${cert.document.title}</p>
          <p><strong>Type:</strong> ${cert.document.type}</p>
          <p><strong>Status:</strong> ${cert.document.status}</p>
        </div>
        <div class="section">
          <h2>Signatures</h2>
          <table>
            <thead>
              <tr><th>Signer</th><th>Signed At</th><th>IP Address</th></tr>
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
          <p><strong>Generated:</strong> ${new Date(cert.generatedAt).toLocaleString()}</p>
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

  private getMockDocuments() {
    return [
      {
        id: '1',
        title: 'Sale Agreement - Villa A101',
        documentType: 'Contract',
        propertyId: '1',
        property: { title: 'Penthouse with Panoramic City View' },
        versions: [{ fileUrl: 'sample.pdf', version: 1, uploadedAt: new Date() }],
        isSigned: false,
        createdAt: new Date()
      },
      {
        id: '2',
        title: 'Property Title Deed',
        documentType: 'Property Paper',
        propertyId: '2',
        property: { title: 'Ultra Luxury Beachfront Villa' },
        versions: [{ fileUrl: 'deed.pdf', version: 2, uploadedAt: new Date() }],
        isSigned: true,
        createdAt: new Date()
      }
    ];
  }
}
