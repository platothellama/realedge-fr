import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { PropertiesComponent } from './pages/properties/properties';
import { PropertyDetailsComponent } from './pages/property-details/property-details';
import { CrmComponent } from './pages/crm/crm';
import { DealsComponent } from './pages/deals/deals';
import { FinanceComponent } from './pages/finance/finance';
import { TasksComponent } from './pages/tasks/tasks';
import { MarketComponent } from './pages/market/market';
import { AnnouncementsComponent } from './pages/announcements/announcements';
import { AiInsightsComponent } from './pages/ai-insights/ai-insights';
import { VisitsComponent } from './pages/visits/visits';
import { LoginComponent } from './pages/auth/login';
import { UserManagementComponent } from './pages/user-management/user-management';
import { MarketingComponent } from './pages/marketing/marketing';
import { DocumentsPageComponent } from './pages/documents/documents';
import { InvoicesComponent } from './pages/invoices/invoices';
import { ExpensesComponent } from './pages/expenses/expenses';
import { CommissionsComponent } from './pages/commissions/commissions';
import { MarketingAutomationComponent } from './pages/marketing-automation/marketing-automation';
import { WebsiteBuilderComponent } from './pages/website-builder/website-builder';
import { WebsiteEditorComponent } from './pages/website-editor/website-editor';
import { PublicWebsiteComponent } from './pages/public-website/public-website';
import { BuyerPreferencesComponent } from './pages/buyer-preferences/buyer-preferences';
import { PropertyMatcherComponent } from './pages/property-matcher/property-matcher';
import { AiAssistant } from './pages/ai-assistant/ai-assistant';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'website/:slug', component: PublicWebsiteComponent },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'properties', component: PropertiesComponent },
      { path: 'properties/:id', component: PropertyDetailsComponent },
      { path: 'crm', component: CrmComponent },
      { path: 'deals', component: DealsComponent },
      { path: 'documents', component: DocumentsPageComponent },
      { path: 'visits', component: VisitsComponent },
      { path: 'marketing', component: MarketingComponent },
      { path: 'marketing-automation', component: MarketingAutomationComponent },
      { path: 'ai-assistant', component: AiAssistant },
      {
        path: 'website-builder',
        component: WebsiteBuilderComponent,
        data: { roles: ['Super Admin', 'Admin'] }
      },
      {
        path: 'website-editor/:id',
        component: WebsiteEditorComponent,
        data: { roles: ['Super Admin', 'Admin'] }
      },
      {
        path: 'finance',
        component: FinanceComponent,
        data: { roles: ['Super Admin', 'Admin', 'Accountant'] }
      },
      {
        path: 'user-management',
        component: UserManagementComponent,
        data: { roles: ['Super Admin', 'Admin', 'Office Manager'] }
      },
      {
        path: 'invoices',
        component: InvoicesComponent,
        data: { roles: ['Super Admin', 'Admin', 'Accountant'] }
      },
      {
        path: 'expenses',
        component: ExpensesComponent,
        data: { roles: ['Super Admin', 'Admin', 'Accountant'] }
      },
      {
        path: 'commissions',
        component: CommissionsComponent,
        data: { roles: ['Super Admin', 'Admin', 'Accountant'] }
      },
      {
        path: 'tasks',
        component: TasksComponent,
        data: { roles: ['Super Admin', 'Admin'] }
      },
      {
        path: 'market',
        component: MarketComponent,
        data: { roles: ['Super Admin', 'Admin'] }
      },
      {
        path: 'announcements',
        component: AnnouncementsComponent,
        data: { roles: ['Super Admin', 'Admin'] }
      },
      {
        path: 'ai-insights',
        component: AiInsightsComponent,
        data: { roles: ['Super Admin', 'Admin'] }
      },
      {
        path: 'buyer-preferences',
        component: BuyerPreferencesComponent
      },
      {
        path: 'property-matcher/:id',
        component: PropertyMatcherComponent
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
