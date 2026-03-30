import { Component, computed, inject } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { FeatureService } from '../../services/feature/feature.service';
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
  private features = inject(FeatureService);
  user = this.auth.currentUser;

  constructor() {}

  menuItems = computed(() => {
    const role = this.user()?.role?.toLowerCase().replace(' ', '');
    const isEnabled = (key: string) => this.features.isEnabled(key, this.user()?.role);

    const items = [
      // Dashboard
      { label: 'Dashboard', icon: 'dashboard', link: '/dashboard' },

      // Core Business
      { label: 'Properties', icon: 'home', link: '/properties' },
      { label: 'Sellers', icon: 'person', link: '/sellers' },
      { label: 'CRM / Leads', icon: 'people', link: '/crm' },
      { label: 'Visits Calendar', icon: 'calendar_today', link: '/visits' },
      { label: 'Deals & Contracts', icon: 'handshake', link: '/deals' },
      // { label: 'Documents', icon: 'description', link: '/documents' },
      { label: 'Documents Manager', icon: 'folder_copy', link: '/documents-manager' },

      // Marketing
      { label: 'Marketing Tools', icon: 'campaign', link: '/marketing', feature: 'marketing_automation' },
      { label: 'Marketing Automation', icon: 'autorenew', link: '/marketing-automation', feature: 'marketing_automation' },

      // AI Tools
      { label: 'AI Assistant', icon: 'smart_toy', link: '/ai-assistant', feature: 'ai_assistant' },
      { label: 'Property Matcher', icon: 'auto_awesome', link: '/buyer-preferences', feature: 'ai_assistant' },
    ];

    if (['superadmin', 'admin', 'accountant'].includes(role || '')) {
      items.push({ label: 'Invoices', icon: 'receipt_long', link: '/invoices', feature: 'invoices' });
      items.push({ label: 'Expenses', icon: 'account_balance_wallet', link: '/expenses', feature: 'expenses' });
      items.push({ label: 'Commissions', icon: 'percent', link: '/commissions' });
      items.push({ label: 'Commission Settings', icon: 'tune', link: '/commission-settings' });
    }

    if (['superadmin', 'admin', 'broker', 'officemanager'].includes(role || '')) {
      items.push({ label: 'Team Management', icon: 'groups', link: '/groups', feature: 'user_management' });
    }

    if (['superadmin', 'admin'].includes(role || '')) {
      items.push({ label: 'Office Tasks', icon: 'task_alt', link: '/tasks', feature: 'tasks' });
      items.push({ label: 'Announcements', icon: 'campaign', link: '/announcements', feature: 'announcements' });
      items.push({ label: 'Organization', icon: 'admin_panel_settings', link: '/user-management', feature: 'user_management' });
      items.push({ label: 'Market Intelligence', icon: 'analytics', link: '/market', feature: 'market_intelligence' });
      items.push({ label: 'AI Insights', icon: 'psychology', link: '/ai-insights', feature: 'ai_assistant' });
    }

    items.push({ label: 'Settings', icon: 'settings', link: '#' });

    return items.filter(item => {
      if (!item.feature) return true;
      return isEnabled(item.feature);
    });
  });

  logout() {
    this.auth.logout();
  }
}
