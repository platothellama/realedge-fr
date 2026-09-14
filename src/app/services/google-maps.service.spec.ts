import { TestBed } from '@angular/core/testing';
import { GoogleMapsService } from './google-maps.service';
import { environment } from '../../environments/environment';

// PHASE 1: with no hardcoded key, an unconfigured environment must reject
// with a clear error (the APP_INITIALIZER swallows this and boots anyway).
describe('GoogleMapsService', () => {
  it('rejects clearly when no API key is configured', async () => {
    const prev = (environment as any).GOOGLE_MAPS_API_KEY;
    (environment as any).GOOGLE_MAPS_API_KEY = '';
    try {
      const service = TestBed.inject(GoogleMapsService);
      await expect(service.load()).rejects.toThrow('Google Maps API key not configured');
    } finally {
      (environment as any).GOOGLE_MAPS_API_KEY = prev;
    }
  });
});
