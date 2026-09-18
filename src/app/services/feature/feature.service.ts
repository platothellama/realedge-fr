import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

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
  private apiUrl = `${environment.apiUrl}/features`;
  
  features = signal<FeatureFlags>({});

  constructor(private http: HttpClient) {
    this.loadFeatures();
  }

  async loadFeatures() {
    try {
      const res = await firstValueFrom(this.http.get<any>(`${this.apiUrl}/enabled`));
      if (res.status === 'success') {
        this.features.set(res.data);
      }
    } catch (err) {
      console.warn('Could not load feature flags:', err);
    }
  }

  isEnabled(key: string, role?: string): boolean {
    const features = this.features();
    const feature = features[key];
    if (!feature || !feature.enabled) return false;
    if (!feature.enabledForRoles || feature.enabledForRoles.length === 0) return true;
    // QA hardening 2026-09-18: a role-restricted flag must NOT pass when the
    // caller has no role (previously returned true -> gate bypass).
    if (!role) return false;
    return feature.enabledForRoles.includes(role);
  }
}
