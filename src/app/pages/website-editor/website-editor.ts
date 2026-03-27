import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { SectionEditorComponent } from './section-editor';

interface Section {
  id: string;
  componentType: string;
  designVariant: string;
  name: string;
  config: any;
  content: any;
  styles: any;
  order: number;
  isVisible: boolean;
}

interface Page {
  id: string;
  name: string;
  slug: string;
  title: string;
  sections: Section[];
  isHomepage: boolean;
}

interface Website {
  id: string;
  name: string;
  slug: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  pages: Page[];
}

@Component({
  selector: 'app-website-editor',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule,
    MatTabsModule, MatProgressSpinnerModule, MatSnackBarModule, MatMenuModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatChipsModule, FormsModule,
    SectionEditorComponent
  ],
  templateUrl: './website-editor.html',
  styleUrl: './website-editor.css'
})
export class WebsiteEditorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);

  loading = true;
  website!: Website;
  selectedPageIndex = 0;
  showComponentPanel = false;
  showSectionEditor = false;
  selectedSection: Section | null = null;
  componentTemplates: any[] = [];
  categories = ['Header', 'Hero', 'Content', 'Properties', 'Forms', 'Group', 'Social', 'CTA', 'Footer', 'Maps'];
  selectedCategory = 'Hero';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadWebsite(id);
      this.loadComponentTemplates();
    }
  }

  loadWebsite(id: string) {
    this.loading = true;
    this.api.getWebsite(id).subscribe({
      next: (res: any) => { 
        console.log('Website loaded:', res);
        this.website = res; 
        this.loading = false; 
      },
      error: (err) => { 
        console.error('Error loading website:', err);
        this.loading = false; 
        this.snackBar.open('Error loading website', 'Close', { duration: 3000 });
      }
    });
  }

  loadComponentTemplates() {
    this.api.getComponentTemplates(this.selectedCategory).subscribe({
      next: (res: any) => {
        this.componentTemplates = Array.isArray(res) ? res : (res?.data || []);
      }
    });
  }

  selectPage(index: number) {
    this.selectedPageIndex = index;
  }

  addSection(template: any) {
    console.log('Adding section. Website:', this.website);
    console.log('Pages:', this.website?.pages);
    console.log('Selected page index:', this.selectedPageIndex);
    
    if (!this.website?.pages || this.website.pages.length === 0) {
      this.snackBar.open('No pages found. Creating default page...', 'Close', { duration: 3000 });
      // Create a default page first
      this.api.createWebsitePage(this.website.id, {
        name: 'Home',
        slug: 'home',
        title: 'Welcome',
        isHomepage: true,
        isPublished: false,
        order: 0
      }).subscribe({
        next: (newPage) => {
          this.website!.pages = [newPage];
          this.addSection(template);
        },
        error: (err) => {
          this.snackBar.open('Error creating page: ' + err.message, 'Close', { duration: 3000 });
        }
      });
      return;
    }

    const currentPage = this.website.pages[this.selectedPageIndex] || this.website.pages[0];
    if (!currentPage) {
      this.snackBar.open('No page selected', 'Close', { duration: 3000 });
      return;
    }

    const section: Partial<Section> = {
      componentType: template.componentType,
      designVariant: template.variants?.[0] || 'default',
      name: template.name,
      config: template.defaultConfig || {},
      content: template.defaultContent || {},
      styles: {},
      order: currentPage.sections?.length || 0,
      isVisible: true
    };

    this.api.createSection(currentPage.id, section).subscribe({
      next: (res) => {
        if (!currentPage.sections) {
          currentPage.sections = [];
        }
        currentPage.sections.push(res);
        this.showComponentPanel = false;
        this.snackBar.open('Section added', 'Close', { duration: 2000 });
      },
      error: (err) => {
        console.error('Error adding section:', err);
        this.snackBar.open('Error adding section: ' + err.message, 'Close', { duration: 3000 });
      }
    });
  }

  deleteSection(section: Section) {
    this.api.deleteSection(section.id).subscribe({
      next: () => {
        const page = this.website.pages[this.selectedPageIndex];
        page.sections = page.sections.filter(s => s.id !== section.id);
        this.snackBar.open('Section removed', 'Close', { duration: 2000 });
      },
      error: () => this.snackBar.open('Error removing section', 'Close', { duration: 3000 })
    });
  }

  editSection(section: Section) {
    this.selectedSection = { 
      ...section,
      order: section.order ?? 0,
      isVisible: section.isVisible ?? true
    };
    this.showSectionEditor = true;
  }

  onSectionSaved(section: any) {
    const page = this.website.pages[this.selectedPageIndex];
    const index = page.sections.findIndex(s => s.id === section.id);
    if (index !== -1) {
      page.sections[index] = section;
    }
    this.showSectionEditor = false;
    this.selectedSection = null;
  }

  closeSectionEditor() {
    this.showSectionEditor = false;
    this.selectedSection = null;
  }

  saveWebsite() {
    this.api.updateWebsite(this.website.id, this.website).subscribe({
      next: () => this.snackBar.open('Website saved', 'Close', { duration: 2000 }),
      error: () => this.snackBar.open('Error saving website', 'Close', { duration: 3000 })
    });
  }

  getComponentIcon(type: string): string {
    const icons: Record<string, string> = {
      header: 'view_quilt',
      hero: 'wallpaper',
      propertySearch: 'search',
      featureCards: 'widgets',
      about: 'info',
      propertyGrid: 'grid_view',
      propertyCarousel: 'view_carousel',
      contactForm: 'contact_mail',
      newsletter: 'mark_email_read',
      leadCapture: 'person_add',
      agentGroup: 'groups',
      testimonials: 'format_quote',
      cta: 'touch_app',
      footer: 'footer',
      propertyMap: 'map',
      blog: 'article'
    };
    return icons[type] || 'widgets';
  }
}
