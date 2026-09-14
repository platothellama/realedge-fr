import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth/auth.service';

@Component({ template: '', standalone: true })
class DummyLoginComponent {}

// PHASE 1: expired/invalid sessions must clear local state and redirect to
// /login exactly once (no retries, no loops, auth endpoints excluded).
describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'login', component: DummyLoginComponent }]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  function loginAsAgent() {
    localStorage.setItem('token', 't123');
    localStorage.setItem('user', JSON.stringify({ id: '1', name: 'N', email: 'e', role: 'Agent' }));
    // Re-read session state (service constructor ran before localStorage set).
    (auth as any).currentUser.set(JSON.parse(localStorage.getItem('user')!));
    (auth as any).isAuthenticated.set(true);
  }

  it('attaches the Bearer token', () => {
    loginAsAgent();
    http.get('/api/properties').subscribe();
    const req = httpMock.expectOne('/api/properties');
    expect(req.request.headers.get('Authorization')).toBe('Bearer t123');
    req.flush([]);
  });

  it('sends no Authorization header when logged out', () => {
    http.get('/api/auth/logs').subscribe();
    const req = httpMock.expectOne('/api/auth/logs');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('401 on a data endpoint clears the session and redirects once', () => {
    loginAsAgent();
    const logout = vi.spyOn(auth, 'logout');
    const router = TestBed.inject(Router);
    const nav = vi.spyOn(router, 'navigate');
    http.get('/api/properties').subscribe({ next: () => {}, error: () => {} });
    const req = httpMock.expectOne('/api/properties');
    req.flush({ status: 'fail' }, { status: 401, statusText: 'Unauthorized' });
    expect(logout).toHaveBeenCalledTimes(1);
    expect(nav).toHaveBeenCalledWith(['/login'], { queryParams: { session: 'expired' } });
    expect(localStorage.getItem('token')).toBeNull();
    httpMock.expectNone('/api/properties'); // no retry loop
  });

  it('401 on an auth endpoint does not force logout', () => {
    loginAsAgent();
    const logout = vi.spyOn(auth, 'logout');
    http.post('/api/auth/login', {}).subscribe({ next: () => {}, error: () => {} });
    const req = httpMock.expectOne('/api/auth/login');
    req.flush({ status: 'fail' }, { status: 401, statusText: 'Unauthorized' });
    expect(logout).not.toHaveBeenCalled();
  });
});
