import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

// QA 2026-09-18: all feature routes lazy-load (initial bundle was 3.14MB)
// and carry titles. Guards/data contracts unchanged.
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login').then((m) => m.LoginComponent),
    title: 'Sign in',
  },
  {
    path: 'website/:slug',
    loadComponent: () =>
      import('./pages/public-website/public-website').then((m) => m.PublicWebsiteComponent),
    title: 'Website',
  },
  {
    path: 'sign/:documentId/:token',
    loadComponent: () =>
      import('./pages/document-sign/document-sign').then((m) => m.DocumentSignPageComponent),
    title: 'Sign document',
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.DashboardComponent),
        title: 'Dashboard',
      },
      {
        path: 'properties',
        loadComponent: () => import('./pages/properties/properties').then((m) => m.PropertiesComponent),
        title: 'Properties',
      },
      {
        path: 'properties/:id',
        loadComponent: () =>
          import('./pages/property-details/property-details').then((m) => m.PropertyDetailsComponent),
        title: 'Property details',
      },
      {
        path: 'crm',
        loadComponent: () => import('./pages/crm/crm').then((m) => m.CrmComponent),
        title: 'CRM',
      },
      {
        path: 'leads/:id',
        loadComponent: () =>
          import('./pages/lead-details/lead-details').then((m) => m.LeadDetailsComponent),
        title: 'Lead details',
      },
      {
        path: 'deals',
        loadComponent: () => import('./pages/deals/deals').then((m) => m.DealsComponent),
        title: 'Deals',
      },
      {
        path: 'commissions',
        loadComponent: () =>
          import('./pages/commissions/commissions').then((m) => m.CommissionsComponent),
        title: 'Commissions',
      },
      {
        path: 'commission-settings',
        loadComponent: () =>
          import('./pages/commission-settings/commission-settings').then(
            (m) => m.CommissionSettingsComponent
          ),
        data: { roles: ['Super Admin', 'Admin', 'Accountant'] },
        title: 'Commission settings',
      },
      {
        path: 'payments',
        loadComponent: () => import('./pages/payments/payments').then((m) => m.PaymentsComponent),
        data: { roles: ['Super Admin', 'Admin', 'Accountant'] },
        title: 'Payments',
      },
      {
        path: 'sellers',
        loadComponent: () => import('./pages/sellers/sellers').then((m) => m.SellersComponent),
        title: 'Sellers',
      },
      {
        path: 'sellers/:id',
        loadComponent: () =>
          import('./pages/sellers/seller-details').then((m) => m.SellerDetailsComponent),
        title: 'Seller details',
      },
      {
        path: 'documents',
        loadComponent: () => import('./pages/documents/documents').then((m) => m.DocumentsPageComponent),
        title: 'Documents',
      },
      {
        path: 'documents/:id',
        loadComponent: () => import('./pages/documents/documents').then((m) => m.DocumentsPageComponent),
        title: 'Documents',
      },
      {
        path: 'documents-manager',
        loadComponent: () =>
          import('./pages/document-manager-page/document-manager-page').then(
            (m) => m.DocumentManagerPageComponent
          ),
        title: 'Document manager',
      },
      {
        path: 'documents-manager/:id',
        loadComponent: () =>
          import('./pages/document-manager-page/document-manager-page').then(
            (m) => m.DocumentManagerPageComponent
          ),
        title: 'Document manager',
      },
      {
        path: 'visits',
        loadComponent: () => import('./pages/visits/visits').then((m) => m.VisitsComponent),
        title: 'Visits',
      },
      {
        path: 'marketing',
        loadComponent: () => import('./pages/marketing/marketing').then((m) => m.MarketingComponent),
        data: { feature: 'marketing_automation' },
        title: 'Marketing',
      },
      {
        path: 'marketing-automation',
        loadComponent: () =>
          import('./pages/marketing-automation/marketing-automation').then(
            (m) => m.MarketingAutomationComponent
          ),
        data: { feature: 'marketing_automation' },
        title: 'Marketing automation',
      },
      {
        path: 'ai-assistant',
        loadComponent: () =>
          import('./pages/ai-assistant/ai-assistant').then((m) => m.AiAssistantComponent),
        data: { feature: 'ai_assistant' },
        title: 'AI assistant',
      },
      {
        path: 'website-builder',
        loadComponent: () =>
          import('./pages/website-builder/website-builder').then((m) => m.WebsiteBuilderComponent),
        data: { roles: ['Super Admin', 'Admin'], feature: 'website_builder' },
        title: 'Website builder',
      },
      {
        path: 'website-editor/:id',
        loadComponent: () =>
          import('./pages/website-editor/website-editor').then((m) => m.WebsiteEditorComponent),
        data: { roles: ['Super Admin', 'Admin'], feature: 'website_builder' },
        title: 'Website editor',
      },
      {
        path: 'finance',
        loadComponent: () => import('./pages/finance/finance').then((m) => m.FinanceComponent),
        data: { roles: ['Super Admin', 'Admin', 'Accountant'], feature: 'finance' },
        title: 'Finance',
      },
      {
        path: 'user-management',
        loadComponent: () =>
          import('./pages/user-management/user-management').then((m) => m.UserManagementComponent),
        data: { roles: ['Super Admin', 'Admin', 'Office Manager'], feature: 'user_management' },
        title: 'User management',
      },
      {
        path: 'invoices',
        loadComponent: () => import('./pages/invoices/invoices').then((m) => m.InvoicesComponent),
        data: { roles: ['Super Admin', 'Admin', 'Accountant'], feature: 'invoices' },
        title: 'Invoices',
      },
      {
        path: 'expenses',
        loadComponent: () => import('./pages/expenses/expenses').then((m) => m.ExpensesComponent),
        data: { roles: ['Super Admin', 'Admin', 'Accountant'], feature: 'expenses' },
        title: 'Expenses',
      },
      {
        path: 'groups',
        loadComponent: () => import('./pages/groups/groups').then((m) => m.GroupsComponent),
        data: { roles: ['Super Admin', 'Admin', 'Broker', 'Office Manager'], feature: 'user_management' },
        title: 'Groups',
      },
      {
        path: 'tasks',
        loadComponent: () => import('./pages/tasks/tasks').then((m) => m.TasksComponent),
        data: { roles: ['Super Admin', 'Admin'], feature: 'tasks' },
        title: 'Tasks',
      },
      {
        path: 'market',
        loadComponent: () => import('./pages/market/market').then((m) => m.MarketComponent),
        data: { roles: ['Super Admin', 'Admin'], feature: 'market_intelligence' },
        title: 'Market',
      },
      {
        path: 'announcements',
        loadComponent: () =>
          import('./pages/announcements/announcements').then((m) => m.AnnouncementsComponent),
        data: { roles: ['Super Admin', 'Admin'], feature: 'announcements' },
        title: 'Announcements',
      },
      {
        path: 'ai-insights',
        loadComponent: () =>
          import('./pages/ai-insights/ai-insights').then((m) => m.AiInsightsComponent),
        data: { roles: ['Super Admin', 'Admin'], feature: 'ai_assistant' },
        title: 'AI insights',
      },
      {
        path: 'buyer-preferences',
        loadComponent: () =>
          import('./pages/buyer-preferences/buyer-preferences').then(
            (m) => m.BuyerPreferencesComponent
          ),
        data: { feature: 'ai_assistant' },
        title: 'Buyer preferences',
      },
      {
        path: 'property-matcher/:id',
        loadComponent: () =>
          import('./pages/property-matcher/property-matcher').then((m) => m.PropertyMatcherComponent),
        data: { feature: 'ai_assistant' },
        title: 'Property matcher',
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundComponent),
    title: 'Not found',
  },
];
