import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsService {
  private loadPromise: Promise<void> | null = null;

  load(): Promise<void> {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    const apiKey = environment.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return Promise.reject(new Error('Google Maps API key not configured'));
    }

    if (typeof google !== 'undefined' && (google as any).maps) {
      return Promise.resolve();
    }

    this.loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Maps'));
      document.head.appendChild(script);
    });

    return this.loadPromise;
  }
}
