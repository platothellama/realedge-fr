import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatMenuModule, MatBadgeModule, MatDividerModule],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css'
})
export class NotificationsComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  notifications = signal<any[]>([]);
  unreadCount = signal<number>(0);

  ngOnInit() {
    this.fetchNotifications();
    this.fetchUnreadCount();
  }

  fetchNotifications() {
    this.api.getNotifications().subscribe({
      next: (res) => this.notifications.set(res),
      error: (err) => console.error('Failed to fetch notifications', err)
    });
  }

  fetchUnreadCount() {
    this.api.getUnreadCount().subscribe({
      next: (res) => this.unreadCount.set(res.unreadCount),
      error: (err) => console.error('Failed to fetch count', err)
    });
  }

  markAsRead(notification: any) {
    if (!notification.isRead) {
      this.api.markNotificationRead(notification.id).subscribe({
        next: () => {
          notification.isRead = true;
          this.unreadCount.update(c => Math.max(0, c - 1));
        }
      });
    }

    if (notification.link) {
      this.router.navigate([notification.link]);
    }
  }

  markAllAsRead() {
    this.api.markAllNotificationsRead().subscribe({
      next: () => {
        this.notifications.update(notifs => 
          notifs.map(n => ({ ...n, isRead: true }))
        );
        this.unreadCount.set(0);
      }
    });
  }

  deleteNotification(notification: any, event: Event) {
    event.stopPropagation();
    this.api.deleteNotification(notification.id).subscribe({
      next: () => {
        this.notifications.update(notifs => 
          notifs.filter(n => n.id !== notification.id)
        );
        if (!notification.isRead) {
          this.unreadCount.update(c => Math.max(0, c - 1));
        }
      }
    });
  }

  getIcon(type: string): string {
    switch (type) {
      case 'lead': return 'person_add';
      case 'deal': return 'handshake';
      case 'visit': return 'calendar_today';
      case 'document': return 'description';
      case 'reminder': return 'alarm';
      default: return 'notifications';
    }
  }

  getTimeAgo(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }
}
