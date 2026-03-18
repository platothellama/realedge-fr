import { Component, computed, inject } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [MatListModule, MatIconModule, RouterModule, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private auth = inject(AuthService);
  user = this.auth.currentUser;

  constructor() {}

  menuItems = computed(() => {
    const role = this.user()?.role;

    const items = [
      { label: 'Dashboard', icon: 'dashboard', link: '/dashboard' },
      { label: 'Properties', icon: 'home', link: '/properties' },
      { label: 'CRM / Leads', icon: 'people', link: '/crm' },
      { label: 'Visits Calendar', icon: 'calendar_today', link: '/visits' },
      { label: 'Deals & Contracts', icon: 'handshake', link: '/deals' },
      { label: 'Documents', icon: 'description', link: '/documents' },
      { label: 'Marketing Tools', icon: 'campaign', link: '/marketing' },
      { label: 'Marketing Automation', icon: 'autorenew', link: '/marketing-automation' },
      { label: 'AI Assistant', icon: 'smart_toy', link: '/ai-assistant' },
      { label: 'Property Matcher', icon: 'auto_awesome', link: '/buyer-preferences' },
    ];

    if (['Super Admin', 'Admin'].includes(role || '')) {
      items.push({ label: 'Office Tasks', icon: 'task_alt', link: '/tasks' });
      items.push({ label: 'Market Intelligence', icon: 'analytics', link: '/market' });
      items.push({ label: 'AI Insights', icon: 'psychology', link: '/ai-insights' });
      items.push({ label: 'Announcements', icon: 'campaign', link: '/announcements' });
      items.push({ label: 'Website Builder', icon: 'web', link: '/website-builder' });
    }

    if (['Super Admin', 'Admin', 'Accountant'].includes(role || '')) {
      items.push({ label: 'Invoices', icon: 'receipt_long', link: '/invoices' });
      items.push({ label: 'Expenses', icon: 'account_balance_wallet', link: '/expenses' });
      items.push({ label: 'Commissions', icon: 'percent', link: '/commissions' });
    }

    items.push({ label: 'Settings', icon: 'settings', link: '#' });

    return items;
  });

  logout() {
    this.auth.logout();
  }
}
