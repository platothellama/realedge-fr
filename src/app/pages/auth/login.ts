import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = signal(false);
  error = signal<string | null>(null);
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      // No minLength: this is sign-in, not registration — the backend
      // accepts any non-empty password (comparePassword only).
      password: ['', [Validators.required]]
    });

    // Session-expiry bounce lands here with ?session=expired (see the auth
    // interceptor). Explain the redirect instead of showing a bare form.
    if (this.route.snapshot.queryParamMap.get('session') === 'expired') {
      this.error.set('Your session expired. Please sign in again.');
    }
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.loading.set(true);
      this.error.set(null);
      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          // QA 2026-09-18: honor the pre-login deep link (was always dashboard).
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
          if (returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//')) {
            this.router.navigateByUrl(returnUrl);
          } else {
            this.router.navigate(['/dashboard']);
          }
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Invalid credentials. Please try again.');
          this.loading.set(false);
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
