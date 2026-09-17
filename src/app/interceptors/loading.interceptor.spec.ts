import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpContext,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import {
  loadingInterceptor,
  SKIP_LOADER,
} from './loading.interceptor';
import { LoadingService } from '../services/loading/loading.service';

describe('loadingInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let loader: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loadingInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    loader = TestBed.inject(LoadingService);
    loader.reset();
  });

  afterEach(() => {
    httpMock.verify();
    loader.reset();
  });

  it('sets loading true while a request is in flight, false after it completes', () => {
    expect(loader.isLoading()).toBe(false);
    http.get('/api/properties').subscribe();
    expect(loader.isLoading()).toBe(true);
    expect(loader.pendingRequests()).toBe(1);

    const req = httpMock.expectOne('/api/properties');
    req.flush([]);
    expect(loader.isLoading()).toBe(false);
    expect(loader.pendingRequests()).toBe(0);
  });

  it('stays loading until ALL concurrent requests finish', () => {
    http.get('/api/a').subscribe();
    http.get('/api/b').subscribe();
    expect(loader.pendingRequests()).toBe(2);

    httpMock.expectOne('/api/a').flush({});
    expect(loader.isLoading()).toBe(true);
    expect(loader.pendingRequests()).toBe(1);

    httpMock.expectOne('/api/b').flush({});
    expect(loader.isLoading()).toBe(false);
  });

  it('hides the loader on request error', () => {
    http.get('/api/fails').subscribe({ next: () => {}, error: () => {} });
    expect(loader.isLoading()).toBe(true);
    httpMock
      .expectOne('/api/fails')
      .flush({ message: 'boom' }, { status: 500, statusText: 'Error' });
    expect(loader.isLoading()).toBe(false);
    expect(loader.pendingRequests()).toBe(0);
  });

  it('skips the loader when SKIP_LOADER context is set', () => {
    http
      .get('/api/silent', { context: new HttpContext().set(SKIP_LOADER, true) })
      .subscribe();
    expect(loader.isLoading()).toBe(false);
    httpMock.expectOne('/api/silent').flush({});
    expect(loader.isLoading()).toBe(false);
  });

  it('skips the loader via X-Skip-Loader header and strips it', () => {
    http
      .get('/api/silent-2', { headers: { 'X-Skip-Loader': 'true' } })
      .subscribe();
    expect(loader.isLoading()).toBe(false);
    const req = httpMock.expectOne('/api/silent-2');
    expect(req.request.headers.has('X-Skip-Loader')).toBe(false);
    req.flush({});
    expect(loader.isLoading()).toBe(false);
  });
});
