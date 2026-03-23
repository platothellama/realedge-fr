import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { FeatureService } from '../services/feature/feature.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const featureService = inject(FeatureService);
  const router = inject(Router);

  if (authService.isAuthenticatedSignal()) {
    const user = authService.currentUser();
    const requiredRoles = route.data['roles'] as Array<string>;
    if (requiredRoles && !authService.hasRole(requiredRoles)) {
      router.navigate(['/dashboard']);
      return false;
    }
    const requiredFeature = route.data['feature'] as string;
    if (requiredFeature && !featureService.isEnabled(requiredFeature, user?.role)) {
      router.navigate(['/dashboard']);
      return false;
    }
    return true;
  }

  router.navigate(['/login']);
  return false;
};
