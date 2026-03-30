import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface FeatureFlags {
  [key: string]: {
    enabled: boolean;
    enabledForRoles?: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class FeatureService {
  private apiUrl = 'https://realedge-frontend-production.up.railway.app/api/features';
  
  features = signal<FeatureFlags>({});

  constructor(private http: HttpClient) {
    this.loadFeatures();
  }

  async loadFeatures() {
    try {
      console.log('Loading feature flags from:', `${this.apiUrl}/enabled`);
      const res = await firstValueFrom(this.http.get<any>(`${this.apiUrl}/enabled`));
      console.log('Feature flags response:', res);
      if (res.status === 'success') {
        this.features.set(res.data);
        console.log('Features loaded:', this.features());
      }
    } catch (err) {
      console.warn('Could not load feature flags:', err);
    }
  }

  isEnabled(key: string, role?: string): boolean {
    const features = this.features();
    console.log('Checking isEnabled:', key, role, features);
    const feature = features[key];
    if (!feature || !feature.enabled) return false;
    if (!feature.enabledForRoles || feature.enabledForRoles.length === 0) return true;
    if (!role) return true;
    return feature.enabledForRoles.includes(role);
  }
}