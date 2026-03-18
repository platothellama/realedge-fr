import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

interface Website {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  description?: string;
  logo?: string;
  primaryColor: string;
  status: string;
  isPrimary: boolean;
  pages?: any[];
  createdAt: string;
}

interface Property {
  id: string;
  title: string;
  price: number;
  city: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  photos: string[];
}

@Component({
  selector: 'app-website-builder',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatMenuModule, MatChipsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule,
    MatDialogModule, FormsModule
  ],
  templateUrl: './website-builder.html',
  styleUrl: './website-builder.css'
})
export class WebsiteBuilderComponent implements OnInit {
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);

  loading = true;
  websites: Website[] = [];
  showAddDialog = false;
  showGenerateDialog = false;
  generating = false;
  
  properties: Property[] = [];
  selectedProperties: string[] = [];
  selectedTemplate = 'luxury-showcase';
  propertyTemplate = 'modern-hero';
  useAIContent = true;
  
  currentWebsiteId = '';
  
  newWebsite: Partial<Website> = {
    name: '', slug: '', primaryColor: '#6366f1', status: 'draft'
  };

  templates = [
    { id: 'luxury-showcase', name: 'Luxury Showcase' },
    { id: 'clean-grid', name: 'Clean Grid' }
  ];

  propertyTemplates = [
    { id: 'modern-hero', name: 'Modern Hero' },
    { id: 'elegant-slider', name: 'Elegant Slider' },
    { id: 'minimal-card', name: 'Minimal Card' }
  ];

  ngOnInit() {
    this.loadWebsites();
  }

  loadWebsites() {
    this.api.getWebsites().subscribe({
      next: (res: any) => { this.websites = res || []; this.loading = false; },
      error: () => { this.websites = []; this.loading = false; }
    });
  }

  loadProperties() {
    this.api.getWebsiteDataSources('properties').subscribe({
      next: (res: any) => { 
        this.properties = res || []; 
      },
      error: () => { this.properties = []; }
    });
  }

  createWebsite() {
    if (!this.newWebsite.name || !this.newWebsite.slug) {
      this.snackBar.open('Name and slug are required', 'Close', { duration: 3000 });
      return;
    }
    this.api.createWebsite({ ...this.newWebsite, template: this.selectedTemplate }).subscribe({
      next: (res: any) => {
        this.websites.unshift(res);
        this.showAddDialog = false;
        this.newWebsite = { name: '', slug: '', primaryColor: '#6366f1', status: 'draft' };
        this.snackBar.open('Website created with default pages', 'Close', { duration: 2000 });
      },
      error: () => this.snackBar.open('Error creating website', 'Close', { duration: 3000 })
    });
  }

  openGenerateDialog(websiteId: string) {
    this.currentWebsiteId = websiteId;
    this.selectedProperties = [];
    this.loadProperties();
    this.showGenerateDialog = true;
  }

  generateWebsite() {
    if (!this.currentWebsiteId) return;
    
    this.generating = true;
    this.api.generateWebsite({
      websiteId: this.currentWebsiteId,
      propertyIds: this.selectedProperties.length > 0 ? this.selectedProperties : undefined,
      template: this.selectedTemplate,
      options: {
        propertyTemplate: this.propertyTemplate,
        aiContent: this.useAIContent
      }
    }).subscribe({
      next: (res: any) => {
        this.generating = false;
        this.showGenerateDialog = false;
        this.loadWebsites();
        this.snackBar.open(`Generated ${res.pagesCreated} property pages with ${res.propertiesLinked} properties`, 'Close', { duration: 4000 });
      },
      error: () => {
        this.generating = false;
        this.snackBar.open('Error generating website', 'Close', { duration: 3000 });
      }
    });
  }

  toggleProperty(propertyId: string) {
    const index = this.selectedProperties.indexOf(propertyId);
    if (index > -1) {
      this.selectedProperties.splice(index, 1);
    } else {
      this.selectedProperties.push(propertyId);
    }
  }

  selectAllProperties() {
    if (this.selectedProperties.length === this.properties.length) {
      this.selectedProperties = [];
    } else {
      this.selectedProperties = this.properties.map(p => p.id);
    }
  }

  deleteWebsite(website: Website) {
    if (confirm(`Delete "${website.name}"? This cannot be undone.`)) {
      this.api.deleteWebsite(website.id).subscribe({
        next: () => {
          this.websites = this.websites.filter(w => w.id !== website.id);
          this.snackBar.open('Website deleted', 'Close', { duration: 2000 });
        },
        error: () => this.snackBar.open('Error deleting website', 'Close', { duration: 3000 })
      });
    }
  }

  publishWebsite(website: Website) {
    this.api.updateWebsite(website.id, { status: 'published' }).subscribe({
      next: () => {
        website.status = 'published';
        this.snackBar.open('Website published!', 'Close', { duration: 2000 });
      },
      error: () => this.snackBar.open('Error publishing website', 'Close', { duration: 3000 })
    });
  }

  generateSlug(name: string) {
    this.newWebsite.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'published': return 'status-published';
      case 'draft': return 'status-draft';
      default: return 'status-archived';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
  }
}
