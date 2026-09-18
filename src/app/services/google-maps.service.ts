import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsService {
  private loadPromise: Promise<void> | null = null;

  /** True when an API key is configured (map *can* load). */
  isConfigured(): boolean {
    return !!environment.GOOGLE_MAPS_API_KEY;
  }

  /** True when the Maps JS API is actually usable in this browser session. */
  isLoaded(): boolean {
    return typeof google !== 'undefined' && !!(google as any).maps;
  }

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
