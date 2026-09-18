import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Component } from '@angular/core';
import { vi } from 'vitest';
import { errorInterceptor, SKIP_ERROR_DIALOG } from './error.interceptor';
import { ErrorReportService } from '../services/error-reporting/error-report.service';

@Component({ template: '', standalone: true })
class DummyComponent {}

// Global error popup: every failed HTTP call (all pages) must open the big
// copy-paste dialog — except 401s (session redirect) and explicit opt-outs.
describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let reports: ErrorReportService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'x', component: DummyComponent }]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    reports = TestBed.inject(ErrorReportService);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  it('shows the big popup with a full report on server errors', () => {
    const show = vi.spyOn(reports, 'showNonBlocking').mockImplementation(() => undefined);
    const build = vi.spyOn(reports, 'buildFromHttp');
    let seenStatus = 0;
    http.get('/api/properties').subscribe({ next: () => {}, error: (e) => (seenStatus = e.status) });
    const req = httpMock.expectOne('/api/properties');
    req.flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
    expect(seenStatus).toBe(500); // still rethrown to the page
    expect(build).toHaveBeenCalledTimes(1);
    expect(show).toHaveBeenCalledTimes(1);
    expect(show.mock.calls[0][0].fullText).toContain('REALEDGE ERROR REPORT');
  });

  it('does NOT popup on 401 (session redirect handles it)', () => {
    const show = vi.spyOn(reports, 'showNonBlocking').mockImplementation(() => undefined);
    http.get('/api/properties').subscribe({ next: () => {}, error: () => {} });
    const req = httpMock.expectOne('/api/properties');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(show).not.toHaveBeenCalled();
  });

  it('respects the SKIP_ERROR_DIALOG opt-out', () => {
    const show = vi.spyOn(reports, 'showNonBlocking').mockImplementation(() => undefined);
    http
      .get('/api/notifications/unread-count', { context: new HttpContext().set(SKIP_ERROR_DIALOG, true) })
      .subscribe({ next: () => {}, error: () => {} });
    const req = httpMock.expectOne('/api/notifications/unread-count');
    req.flush({}, { status: 500, statusText: 'Server Error' });
    expect(show).not.toHaveBeenCalled();
  });
});
