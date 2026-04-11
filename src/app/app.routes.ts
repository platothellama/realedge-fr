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
import { MarketingAutomationComponent } from './pages/marketing-automation/marketing-automation';
import { DocumentsPageComponent } from './pages/documents/documents';
import { InvoicesComponent } from './pages/invoices/invoices';
import { ExpensesComponent } from './pages/expenses/expenses';
import { WebsiteBuilderComponent } from './pages/website-builder/website-builder';
import { WebsiteEditorComponent } from './pages/website-editor/website-editor';
import { PublicWebsiteComponent } from './pages/public-website/public-website';
import { BuyerPreferencesComponent } from './pages/buyer-preferences/buyer-preferences';
import { PropertyMatcherComponent } from './pages/property-matcher/property-matcher';
import { AiAssistantComponent } from './pages/ai-assistant/ai-assistant';
import { DocumentSignPageComponent } from './pages/document-sign/document-sign';
import { DocumentManagerPageComponent } from './pages/document-manager-page/document-manager-page';
import { SellersComponent } from './pages/sellers/sellers';
import { SellerDetailsComponent } from './pages/sellers/seller-details';
import { LeadDetailsComponent } from './pages/lead-details/lead-details';
import { GroupsComponent } from './pages/groups/groups';
import { CommissionsComponent } from './pages/commissions/commissions';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'website/:slug', component: PublicWebsiteComponent },
  { path: 'sign/:documentId/:token', component: DocumentSignPageComponent },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'properties', component: PropertiesComponent },
      { path: 'properties/:id', component: PropertyDetailsComponent },
      { path: 'crm', component: CrmComponent },
      { path: 'leads/:id', component: LeadDetailsComponent },
      { path: 'deals', component: DealsComponent },
      { path: 'commissions', component: CommissionsComponent },
      { path: 'sellers', component: SellersComponent },
      { path: 'sellers/:id', component: SellerDetailsComponent },
      { path: 'documents', component: DocumentsPageComponent },
      { path: 'documents/:id', component: DocumentsPageComponent },
      { path: 'documents-manager', component: DocumentManagerPageComponent },
      { path: 'documents-manager/:id', component: DocumentManagerPageComponent },
      { path: 'visits', component: VisitsComponent },
      { path: 'marketing', component: MarketingComponent, data: { feature: 'marketing_automation' } },
      { path: 'marketing-automation', component: MarketingAutomationComponent, data: { feature: 'marketing_automation' } },
      { path: 'ai-assistant', component: AiAssistantComponent, data: { feature: 'ai_assistant' } },
      {
        path: 'website-builder',
        component: WebsiteBuilderComponent,
        data: { roles: ['Super Admin', 'Admin'], feature: 'website_builder' }
      },
      {
        path: 'website-editor/:id',
        component: WebsiteEditorComponent,
        data: { roles: ['Super Admin', 'Admin'], feature: 'website_builder' }
      },
      {
        path: 'finance',
        component: FinanceComponent,
        data: { roles: ['Super Admin', 'Admin', 'Accountant'], feature: 'finance' }
      },
      {
        path: 'user-management',
        component: UserManagementComponent,
        data: { roles: ['Super Admin', 'Admin', 'Office Manager'], feature: 'user_management' }
      },
      {
        path: 'invoices',
        component: InvoicesComponent,
        data: { roles: ['Super Admin', 'Admin', 'Accountant'], feature: 'invoices' }
      },
      {
        path: 'expenses',
        component: ExpensesComponent,
        data: { roles: ['Super Admin', 'Admin', 'Accountant'], feature: 'expenses' }
      },
      {
        path: 'groups',
        component: GroupsComponent,
        data: { roles: ['Super Admin', 'Admin', 'Broker', 'Office Manager'], feature: 'user_management' }
      },
      {
        path: 'tasks',
        component: TasksComponent,
        data: { roles: ['Super Admin', 'Admin'], feature: 'tasks' }
      },
      {
        path: 'market',
        component: MarketComponent,
        data: { roles: ['Super Admin', 'Admin'], feature: 'market_intelligence' }
      },
      {
        path: 'announcements',
        component: AnnouncementsComponent,
        data: { roles: ['Super Admin', 'Admin'], feature: 'announcements' }
      },
      {
        path: 'ai-insights',
        component: AiInsightsComponent,
        data: { roles: ['Super Admin', 'Admin'], feature: 'ai_assistant' }
      },
      {
        path: 'buyer-preferences',
        component: BuyerPreferencesComponent,
        data: { feature: 'ai_assistant' }
      },
      {
        path: 'property-matcher/:id',
        component: PropertyMatcherComponent,
        data: { feature: 'ai_assistant' }
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
