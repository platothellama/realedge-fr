import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth/auth.service';
import { UserFormComponent } from '../../components/user-form/user-form.component';
import { GroupFormComponent } from '../../components/group-form/group-form';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatTabsModule
  ],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css'
})
export class UserManagementComponent implements OnInit {
  users: any[] = [];
  groupsDataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['name', 'email', 'role', 'status', 'actions'];
  groupColumns: string[] = ['name', 'description', 'members', 'actions'];

  private auth = inject(AuthService);

  constructor(
    private api: ApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  get canManageUsers(): boolean {
    const user = this.auth.currentUser();
    return user?.role === 'Admin' || user?.role === 'Super Admin';
  }

  ngOnInit(): void {
    this.fetchUsers();
    this.fetchGroups();
  }

  fetchUsers() {
    this.api.getUsers().subscribe({
      next: (res) => {
        this.users = Array.isArray(res) ? res : (res.data || []);
      },
      error: (err) => {
        this.showError('Failed to fetch users');
        this.users = [];
      }
    });
  }

  fetchGroups() {
    this.api.getGroups().subscribe({
      next: (res: any) => {
        const groupData = res.data || (Array.isArray(res) ? res : []);
        this.groupsDataSource.data = groupData;
      },
      error: (err) => this.showError('Failed to fetch groups')
    });
  }

  openUserForm(user?: any) {
    const dialogRef = this.dialog.open(UserFormComponent, {
      width: '600px',
      data: { user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (user) this.updateUser(user.id, result);
        else this.createUser(result);
      }
    });
  }

  openGroupForm(group?: any) {
    const dialogRef = this.dialog.open(GroupFormComponent, {
      width: '400px',
      data: { group }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (group) this.updateGroup(group.id, result);
        else this.createGroup(result);
      }
    });
  }

  createGroup(data: any) {
    this.api.createGroup(data).subscribe({
      next: () => {
        this.fetchGroups();
        this.snackBar.open('Group created successfully', 'Close', { duration: 3000 });
      },
      error: (err) => this.showError(err.error?.message || 'Error creating group')
    });
  }

  updateGroup(id: string, data: any) {
    this.api.updateGroup(id, data).subscribe({
      next: () => {
        this.fetchGroups();
        this.snackBar.open('Group updated successfully', 'Close', { duration: 3000 });
      },
      error: (err) => this.showError(err.error?.message || 'Error updating group')
    });
  }

  deleteGroup(group: any) {
    if (confirm(`Are you sure you want to delete the group "${group.name}"?`)) {
      this.api.deleteGroup(group.id).subscribe({
        next: () => {
          this.fetchGroups();
          this.snackBar.open('Group deleted successfully', 'Close', { duration: 3000 });
        },
        error: (err) => this.showError(err.error?.message || 'Error deleting group')
      });
    }
  }

  createUser(data: any) {
    this.api.createUser(data).subscribe({
      next: () => {
        this.fetchUsers();
        this.snackBar.open('User created successfully', 'Close', { duration: 3000 });
      },
      error: (err) => this.showError(err.error?.message || 'Error creating user')
    });
  }

  updateUser(id: string, data: any) {
    this.api.updateUser(id, data).subscribe({
      next: () => {
        this.fetchUsers();
        this.snackBar.open('User updated successfully', 'Close', { duration: 3000 });
      },
      error: (err) => this.showError(err.error?.message || 'Error updating user')
    });
  }

  deleteUser(user: any) {
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      this.api.deleteUser(user.id).subscribe({
        next: () => {
          this.fetchUsers();
          this.snackBar.open('User deleted successfully', 'Close', { duration: 3000 });
        },
        error: (err) => this.showError('Error deleting user')
      });
    }
  }

  toggleStatus(user: any) {
    const newData = { ...user, active: !user.active };
    this.api.updateUser(user.id, newData).subscribe({
      next: () => {
        this.fetchUsers();
        this.snackBar.open(`User ${user.active ? 'blocked' : 'restored'} successfully`, 'Close', { duration: 3000 });
      },
      error: (err) => this.showError('Error updating user status')
    });
  }

  private showError(msg: string) {
    this.snackBar.open(msg, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
  }
}
