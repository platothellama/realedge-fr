import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'https://realedge-frontend-production.up.railway.app/api';

  constructor(private http: HttpClient) {}

  // Properties
  getProperties(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/properties`);
  }

  getPropertyById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/properties/${id}`);
  }

  createProperty(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/properties`, data);
  }

  updateProperty(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/properties/${id}`, data);
  }

  deleteProperty(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/properties/${id}`);
  }

  addNegotiation(propertyId: string, data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/properties/${propertyId}/negotiate`, data);
  }

  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<any>(`${this.apiUrl}/properties/upload`, formData);
  }

  // Leads
  getLeads(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/leads`);
  }

  createLead(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/leads`, data);
  }

  updateLead(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/leads/${id}`, data);
  }

  deleteLead(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/leads/${id}`);
  }

  // Auth
  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, credentials);
  }

  register(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/register`, data);
  }

  getMe(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/auth/me`);
  }

  // Groups
  getGroups(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/groups`);
  }

  createGroup(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/groups`, data);
  }

  updateGroup(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/groups/${id}`, data);
  }

  deleteGroup(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/groups/${id}`);
  }

  // Users
  getUsers(): Observable<any> {
    return this.http.get<any>(`https://realedge-frontend-production.up.railway.app/api/users`);
  }

  createUser(data: any): Observable<any> {
    return this.http.post<any>(`https://realedge-frontend-production.up.railway.app/api/users`, data);
  }

  updateUser(id: string, data: any): Observable<any> {
    return this.http.put<any>(`https://realedge-frontend-production.up.railway.app/api/users/${id}`, data);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete<any>(`https://realedge-frontend-production.up.railway.app/api/users/${id}`);
  }

  toggleUserStatus(id: string): Observable<any> {
    return this.http.patch<any>(`https://realedge-frontend-production.up.railway.app/api/users/${id}/toggle-status`, {});
  }

  // AI
  onPriceEstimate(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/ai/estimate`, data);
  }

  // Deals
  getDeals(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/deals`);
  }

  getDealById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/deals/${id}`);
  }

  createDeal(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/deals`, data);
  }

  updateDeal(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/deals/${id}`, data);
  }

  deleteDeal(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/deals/${id}`);
  }

  // Dashboard
  getDashboardStats(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/dashboard/stats`);
  }

  // Visits
  getVisits(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/visits`);
  }

  getVisitById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/visits/${id}`);
  }

  createVisit(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/visits`, data);
  }

  updateVisit(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/visits/${id}`, data);
  }

  deleteVisit(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/visits/${id}`);
  }

  // Documents
  getDocuments(params: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/documents`, { params });
  }

  uploadDocument(data: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/documents/upload`, data);
  }

  addDocumentVersion(id: string, data: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/documents/${id}/version`, data);
  }

  signDocument(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/documents/${id}/sign`, {});
  }

  deleteDocument(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/documents/${id}`);
  }

  // Marketing
  generateMarketingContent(data: { propertyId: string, contentType: string }): Observable<{ content: string }> {
    return this.http.post<{ content: string }>(`${this.apiUrl}/marketing/generate`, data);
  }

  // Notifications
  getNotifications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/notifications`);
  }

  getUnreadCount(): Observable<{ unreadCount: number }> {
    return this.http.get<{ unreadCount: number }>(`${this.apiUrl}/notifications/unread-count`);
  }

  markNotificationRead(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/notifications/${id}/read`, {});
  }

  markAllNotificationsRead(): Observable<any> {
    return this.http.patch(`${this.apiUrl}/notifications/mark-all-read`, {});
  }

  deleteNotification(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/notifications/${id}`);
  }

  // Transactions
  getTransactions(params?: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/transactions`, { params });
  }

  getFinancialSummary(params?: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/transactions/summary`, { params });
  }

  createTransaction(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/transactions`, data);
  }

  // Commissions
  getCommissions(params?: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/commissions`, { params });
  }

  getCommissionStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/commissions/stats`);
  }

  calculateCommission(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/commissions/calculate`, data);
  }

  createCommission(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/commissions`, data);
  }

  updateCommissionStatus(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/commissions/${id}/status`, data);
  }

  deleteCommission(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/commissions/${id}`);
  }

  // Tasks
  getTasks(params?: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tasks`, { params });
  }

  getMyTasks(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tasks/my-tasks`);
  }

  getTaskStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/tasks/stats`);
  }

  createTask(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/tasks`, data);
  }

  updateTask(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/tasks/${id}`, data);
  }

  deleteTask(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tasks/${id}`);
  }

  // Announcements
  getAnnouncements(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/announcements`);
  }

  createAnnouncement(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/announcements`, data);
  }

  // AI Methods
  propertyValuation(propertyId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/ai/property-valuation`, { propertyId });
  }

  marketAnalysis(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/ai/market-analysis`, data);
  }

  leadScoring(leadId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/ai/lead-scoring`, { leadId });
  }

  generatePropertyDescription(propertyId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/ai/generate-description`, { propertyId });
  }

  getPredictiveAnalytics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/ai/predictive-analytics`);
  }

  // Expenses
  getExpenses(params?: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/expenses`, { params });
  }

  createExpense(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/expenses`, data);
  }

  updateExpense(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/expenses/${id}`, data);
  }

  deleteExpense(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/expenses/${id}`);
  }

  approveExpense(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/expenses/${id}/approve`, {});
  }

  getExpenseStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/expenses/stats`);
  }

  getAiInsights(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/ai/insights`);
  }

  getLeadScores(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/ai/lead-scores`);
  }

  getPropertyValuations(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/ai/property-valuations`);
  }

  aiAssistant(message: string, context?: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/ai/assistant`, { message, context });
  }

  getInvoices(filters?: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/invoices`, { params: filters || {} });
  }

  createInvoice(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/invoices`, data);
  }

  updateInvoice(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/invoices/${id}`, data);
  }

  markInvoiceAsPaid(id: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/invoices/${id}/paid`, {});
  }

  deleteInvoice(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/invoices/${id}`);
  }

  getInvoiceStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/invoices/stats`);
  }

  getMarketIntelligence(period?: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/market/intelligence`, { params: period ? { period: period } : {} });
  }

  // Marketing Automation - Campaigns
  getCampaigns(params?: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/marketing/campaigns`, { params });
  }

  createCampaign(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/marketing/campaigns`, data);
  }

  updateCampaign(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/marketing/campaigns/${id}`, data);
  }

  deleteCampaign(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/marketing/campaigns/${id}`);
  }

  sendCampaign(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/marketing/campaigns/${id}/send`, {});
  }

  getCampaignStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/marketing/campaigns/stats`);
  }

  // Website Builder
  getWebsites(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/websites`);
  }

  getWebsite(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/websites/${id}`);
  }

  createWebsite(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/websites`, data);
  }

  updateWebsite(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/websites/${id}`, data);
  }

  deleteWebsite(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/websites/${id}`);
  }

  getWebsitePages(websiteId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/websites/${websiteId}/pages`);
  }

  getWebsitePage(pageId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/websites/pages/${pageId}`);
  }

  createWebsitePage(websiteId: string, data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/websites/${websiteId}/pages`, data);
  }

  updateWebsitePage(pageId: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/websites/pages/${pageId}`, data);
  }

  deleteWebsitePage(pageId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/websites/pages/${pageId}`);
  }

  createSection(pageId: string, data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/websites/pages/${pageId}/sections`, data);
  }

  updateSection(sectionId: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/websites/sections/${sectionId}`, data);
  }

  deleteSection(sectionId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/websites/sections/${sectionId}`);
  }

  reorderSections(sections: any[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/websites/sections/reorder`, { sections });
  }

  getComponentTemplates(category?: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/websites/components/templates`, { 
      params: category ? { category } : {} 
    });
  }

  getWebsiteDataSources(type?: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/websites/data-sources`, {
      params: type ? { type } : {}
    });
  }

  // Website AI Generation & Export
  generateWebsite(data: { websiteId: string, propertyIds?: string[], template?: string, options?: any }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/websites/generate`, data);
  }

  getLayoutTemplates(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/websites/templates/layouts`);
  }

  exportWebsite(websiteId: string, format: string = 'json'): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/websites/export`, { websiteId, format });
  }

  getWebsiteProperties(websiteId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/websites/${websiteId}/properties`);
  }

  linkWebsiteProperties(websiteId: string, propertyIds: string[], featuredIds?: string[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/websites/${websiteId}/properties`, { propertyIds, featuredIds });
  }

  // Buyer Preferences
  getBuyerPreferences(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/buyer-preferences`);
  }

  getBuyerPreferenceById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/buyer-preferences/${id}`);
  }

  createBuyerPreference(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/buyer-preferences`, data);
  }

  updateBuyerPreference(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/buyer-preferences/${id}`, data);
  }

  deleteBuyerPreference(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/buyer-preferences/${id}`);
  }

  matchPropertiesToBuyer(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/buyer-preferences/${id}/match`, {});
  }

  naturalLanguageSearch(data: { query: string, filters?: any }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/buyer-preferences/search`, data);
  }

  generatePropertyEmbeddings(propertyIds?: string[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/buyer-preferences/generate-embeddings`, { propertyIds });
  }

  explainMatch(preferenceId: string, propertyId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/buyer-preferences/explain-match`, { preferenceId, propertyId });
  }

  getEmbeddingModels(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/buyer-preferences/models`);
  }

  getLeadsForMatcher(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/buyer-preferences/leads`);
  }

  clearEmbeddingCache(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/buyer-preferences/clear-cache`, {});
  }
}
