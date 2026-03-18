import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:8000/api';

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

  // Groups Management
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

  // Users Management
  getUsers(): Observable<any> {
    return this.http.get<any>(`http://localhost:8000/api/users`);
  }

  createUser(data: any): Observable<any> {
    return this.http.post<any>(`http://localhost:8000/api/users`, data);
  }

  updateUser(id: string, data: any): Observable<any> {
    return this.http.put<any>(`http://localhost:8000/api/users/${id}`, data);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete<any>(`http://localhost:8000/api/users/${id}`);
  }

  toggleUserStatus(id: string): Observable<any> {
    return this.http.patch<any>(`http://localhost:8000/api/users/${id}/toggle-status`, {});
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

  // AI
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

  generateMarketingContent(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/ai/marketing-content`, data);
  }

  getPredictiveAnalytics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/ai/predictive-analytics`);
  }
}

