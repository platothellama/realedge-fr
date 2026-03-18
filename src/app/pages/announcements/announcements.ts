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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth/auth.service';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
}

@Component({
  selector: 'app-announcements',
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
    MatDialogModule,
    MatChipsModule,
    MatTooltipModule,
    FormsModule
  ],
  templateUrl: './announcements.html',
  styleUrl: './announcements.css'
})
export class AnnouncementsComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  announcements: Announcement[] = [];
  loading = true;
  currentUserName = '';
  filterCategory = 'all';

  constructor() {
    const user = this.auth.currentUser();
    this.currentUserName = user?.name || 'Admin';
  }

  categories = ['general', 'update', 'promotion', 'policy', 'event', 'alert'];
  priorities = ['low', 'medium', 'high', 'urgent'];

  priorityColors: any = {
    low: '#6b7280',
    medium: '#3b82f6',
    high: '#f59e0b',
    urgent: '#ef4444'
  };

  categoryIcons: any = {
    general: 'info',
    update: 'update',
    promotion: 'local_offer',
    policy: 'policy',
    event: 'event',
    alert: 'warning'
  };

  showAddDialog = false;
  newAnnouncement: Partial<Announcement> = {
    title: '',
    content: '',
    priority: 'medium',
    category: 'general'
  };

  ngOnInit() {
    this.fetchAnnouncements();
  }

  fetchAnnouncements() {
    this.loading = true;
    this.api.getAnnouncements().subscribe({
      next: (res) => {
        this.announcements = res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to fetch announcements', err);
        this.loading = false;
        this.announcements = this.getMockAnnouncements();
      }
    });
  }

  get filteredAnnouncements() {
    if (this.filterCategory === 'all') return this.announcements;
    return this.announcements.filter(a => a.category === this.filterCategory);
  }

  createAnnouncement() {
    if (!this.newAnnouncement.title?.trim() || !this.newAnnouncement.content?.trim()) {
      this.snackBar.open('Title and content are required', 'Close', { duration: 3000 });
      return;
    }

    const announcement = {
      ...this.newAnnouncement,
      createdBy: this.currentUserName,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    this.api.createAnnouncement(announcement).subscribe({
      next: (res) => {
        this.announcements.unshift(res);
        this.showAddDialog = false;
        this.resetForm();
        this.snackBar.open('Announcement created', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.announcements.unshift({ ...announcement, id: Date.now().toString() } as Announcement);
        this.showAddDialog = false;
        this.resetForm();
        this.snackBar.open('Announcement created (local)', 'Close', { duration: 3000 });
      }
    });
  }

  deleteAnnouncement(id: string) {
    this.announcements = this.announcements.filter(a => a.id !== id);
    this.snackBar.open('Announcement deleted', 'Close', { duration: 2000 });
  }

  toggleActive(announcement: Announcement) {
    announcement.isActive = !announcement.isActive;
    this.snackBar.open(`Announcement ${announcement.isActive ? 'activated' : 'deactivated'}`, 'Close', { duration: 2000 });
  }

  closeDialog() {
    this.showAddDialog = false;
    this.resetForm();
  }

  resetForm() {
    this.newAnnouncement = {
      title: '',
      content: '',
      priority: 'medium',
      category: 'general'
    };
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }

  isExpired(expiresAt?: string): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }

  getMockAnnouncements(): Announcement[] {
    return [
      {
        id: '1',
        title: 'New Commission Structure',
        content: 'We are excited to announce updated commission rates effective March 1st. Please review the new structure in the documents section.',
        priority: 'high',
        category: 'update',
        createdBy: 'Admin',
        createdAt: '2026-03-10T10:00:00Z',
        expiresAt: '2026-04-01T00:00:00Z',
        isActive: true
      },
      {
        id: '2',
        title: 'Office Closure Notice',
        content: 'The office will be closed on March 20th for team building activities. Emergency contacts are available on the dashboard.',
        priority: 'medium',
        category: 'event',
        createdBy: 'Admin',
        createdAt: '2026-03-12T09:00:00Z',
        isActive: true
      },
      {
        id: '3',
        title: 'System Maintenance',
        content: 'Scheduled maintenance will occur on March 15th from 2 AM to 6 AM. The system may be temporarily unavailable.',
        priority: 'urgent',
        category: 'alert',
        createdBy: 'IT Department',
        createdAt: '2026-03-13T14:00:00Z',
        expiresAt: '2026-03-16T00:00:00Z',
        isActive: true
      },
      {
        id: '4',
        title: 'Q1 Performance Bonus',
        content: 'Top performers for Q1 will receive bonuses based on deal volume. Results will be announced by March 31st.',
        priority: 'low',
        category: 'promotion',
        createdBy: 'Admin',
        createdAt: '2026-03-08T11:00:00Z',
        isActive: true
      },
      {
        id: '5',
        title: 'Updated Privacy Policy',
        content: 'Please review the updated privacy policy regarding client data handling. All agents must acknowledge within 7 days.',
        priority: 'medium',
        category: 'policy',
        createdBy: 'Legal',
        createdAt: '2026-03-05T08:00:00Z',
        isActive: false
      }
    ];
  }
}
