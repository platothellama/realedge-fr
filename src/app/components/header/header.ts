import { Component, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth/auth.service';
import { NotificationsComponent } from '../notifications/notifications';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, CommonModule, NotificationsComponent],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private auth = inject(AuthService);
  private router = inject(Router);
  user = this.auth.currentUser;
  showProfileMenu = false;

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  closeProfileMenu() {
    this.showProfileMenu = false;
  }

  showProfile() {
    this.closeProfileMenu();
    this.router.navigate(['/profile']);
  }

  showSettings() {
    this.closeProfileMenu();
    this.router.navigate(['/settings']);
  }

  logout() {
    this.closeProfileMenu();
    this.auth.logout();
  }
}
