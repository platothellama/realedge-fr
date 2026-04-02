import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { ApiService } from '../../services/api';

interface GroupMember {
  id: string;
  userId: string;
  role: string;
  commissionSplit?: number;
  user?: {
    id: string;
    name: string;
    email: string;
    photo?: string;
  };
}

interface Group {
  id: string;
  name: string;
  description?: string;
  companyCommission?: number;
  members?: GroupMember[];
  memberCount?: number;
}

const ROLE_OPTIONS = [
  { value: 'team_leader', label: 'Team Leader', color: 'primary' },
  { value: 'senior_agent', label: 'Senior Agent', color: 'accent' },
  { value: 'agent', label: 'Agent', color: 'basic' },
  { value: 'trainee', label: 'Trainee', color: 'warn' }
];

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatMenuModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatTabsModule,
    MatBadgeModule
  ],
  templateUrl: './groups.html',
  styleUrl: './groups.css'
})
export class GroupsComponent implements OnInit {
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);

  loading = true;
  groups: Group[] = [];
  users: any[] = [];
  selectedGroup: Group | null = null;
  groupMembers: GroupMember[] = [];
  
  showGroupDialog = false;
  showMemberDialog = false;
  showRoleDialog = false;
  showEditMemberDialog = false;
  isEditMode = false;
  processingId: string | null = null;
  editingMember: GroupMember | null = null;

  groupForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    companyCommission: [10, [Validators.required, Validators.min(0), Validators.max(100)]]
  });

  memberForm: FormGroup = this.fb.group({
    userId: ['', Validators.required],
    role: ['agent', Validators.required],
    commissionSplit: [null]
  });

  editMemberForm: FormGroup = this.fb.group({
    role: ['agent', Validators.required],
    commissionSplit: [null]
  });

  roleOptions = ROLE_OPTIONS;

  ngOnInit() {
    this.loadGroups();
    this.loadUsers();
  }

  loadGroups() {
    this.loading = true;
    this.api.getGroups().subscribe({
      next: (res: any) => {
        this.groups = Array.isArray(res) ? res : res.data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to fetch groups', err);
        this.groups = [];
        this.loading = false;
      }
    });
  }

  loadUsers() {
    this.api.getUsers().subscribe({
      next: (res: any) => {
        this.users = Array.isArray(res) ? res : res.data || [];
      },
      error: (err) => {
        console.error('Failed to fetch users', err);
        this.users = [];
      }
    });
  }

  selectGroup(group: Group) {
    this.selectedGroup = group;
    this.loadGroupMembers(group.id);
  }

  loadGroupMembers(groupId: string) {
    this.api.getGroupMembers(groupId).subscribe({
      next: (res: any) => {
        this.groupMembers = res.data?.members || [];
      },
      error: (err) => {
        console.error('Failed to fetch group members', err);
        this.groupMembers = [];
      }
    });
  }

  openNewGroupDialog() {
    this.isEditMode = false;
    this.groupForm.reset({ name: '', description: '' });
    this.showGroupDialog = true;
  }

  openEditGroupDialog() {
    if (!this.selectedGroup) return;
    this.isEditMode = true;
    this.groupForm.patchValue({
      name: this.selectedGroup.name,
      description: this.selectedGroup.description || '',
      companyCommission: (this.selectedGroup as any).companyCommission || 10
    });
    this.showGroupDialog = true;
  }

  saveGroup() {
    if (this.groupForm.invalid) return;
    
    const data = this.groupForm.value;
    
    if (this.isEditMode && this.selectedGroup) {
      this.api.updateGroup(this.selectedGroup.id, data).subscribe({
        next: (res: any) => {
          const index = this.groups.findIndex(g => g.id === this.selectedGroup!.id);
          if (index > -1) {
            this.groups[index] = { ...this.groups[index], ...res.data || res };
            this.selectedGroup = this.groups[index];
          }
          this.showGroupDialog = false;
          this.snackBar.open('Group updated successfully', 'Close', { duration: 3000 });
        },
        error: (err) => {
          this.snackBar.open('Failed to update group', 'Close', { duration: 3000 });
        }
      });
    } else {
      this.api.createGroup(data).subscribe({
        next: (res: any) => {
          this.groups.unshift(res.data || res);
          this.showGroupDialog = false;
          this.snackBar.open('Group created successfully', 'Close', { duration: 3000 });
        },
        error: (err) => {
          this.snackBar.open('Failed to create group', 'Close', { duration: 3000 });
        }
      });
    }
  }

  deleteGroup(group: Group) {
    if (!confirm(`Are you sure you want to delete "${group.name}"?`)) return;
    
    this.processingId = group.id;
    this.api.deleteGroup(group.id).subscribe({
      next: () => {
        this.groups = this.groups.filter(g => g.id !== group.id);
        if (this.selectedGroup?.id === group.id) {
          this.selectedGroup = null;
          this.groupMembers = [];
        }
        this.processingId = null;
        this.snackBar.open('Group deleted', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.processingId = null;
        this.snackBar.open('Failed to delete group', 'Close', { duration: 3000 });
      }
    });
  }

  openAddMemberDialog() {
    this.memberForm.reset({ role: 'agent', commissionSplit: null });
    this.showMemberDialog = true;
  }

  addMember() {
    if (this.memberForm.invalid || !this.selectedGroup) return;
    
    const { userId, role, commissionSplit } = this.memberForm.value;
    
    this.api.addGroupMember(this.selectedGroup.id, userId, role, commissionSplit).subscribe({
      next: (res: any) => {
        this.groupMembers.push(res.data);
        this.showMemberDialog = false;
        this.snackBar.open('Member added successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to add member', 'Close', { duration: 3000 });
      }
    });
  }

  removeMember(member: GroupMember) {
    if (!this.selectedGroup) return;
    if (!confirm(`Remove ${member.user?.name || 'this user'} from the group?`)) return;
    
    this.processingId = member.id;
    this.api.removeGroupMember(this.selectedGroup.id, member.userId).subscribe({
      next: () => {
        this.groupMembers = this.groupMembers.filter(m => m.id !== member.id);
        this.processingId = null;
        this.snackBar.open('Member removed', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.processingId = null;
        this.snackBar.open('Failed to remove member', 'Close', { duration: 3000 });
      }
    });
  }

  openEditMemberDialog(member: GroupMember) {
    this.editingMember = member;
    this.editMemberForm.patchValue({
      role: member.role,
      commissionSplit: member.commissionSplit
    });
    this.showEditMemberDialog = true;
  }

  saveMemberEdit() {
    if (!this.selectedGroup || !this.editingMember) return;

    const { role, commissionSplit } = this.editMemberForm.value;
    
    this.processingId = this.editingMember.id;
    this.api.updateGroupRoles(this.selectedGroup.id, [{
      userId: this.editingMember.userId,
      role,
      commissionSplit
    }]).subscribe({
      next: (res: any) => {
        const updated = res.data || this.groupMembers;
        const idx = this.groupMembers.findIndex(m => m.userId === this.editingMember!.userId);
        if (idx > -1 && updated[idx]) {
          this.groupMembers[idx] = { ...this.groupMembers[idx], ...updated[idx] };
        }
        this.processingId = null;
        this.showEditMemberDialog = false;
        this.editingMember = null;
        this.snackBar.open('Member updated', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.processingId = null;
        this.snackBar.open('Failed to update member', 'Close', { duration: 3000 });
      }
    });
  }

  updateMemberRole(member: GroupMember, newRole: string) {
    if (!this.selectedGroup) return;
    
    const members = [{ userId: member.userId, role: newRole, commissionSplit: member.commissionSplit }];
    
    this.processingId = member.id;
    this.api.updateGroupRoles(this.selectedGroup.id, members).subscribe({
      next: (res: any) => {
        this.groupMembers = res.data || this.groupMembers;
        this.processingId = null;
        this.snackBar.open('Role updated', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.processingId = null;
        this.snackBar.open('Failed to update role', 'Close', { duration: 3000 });
      }
    });
  }

  getRoleLabel(role: string): string {
    return this.roleOptions.find(r => r.value === role)?.label || role;
  }

  getRoleClass(role: string): string {
    switch (role) {
      case 'team_leader': return 'role-leader';
      case 'senior_agent': return 'role-senior';
      case 'agent': return 'role-agent';
      case 'trainee': return 'role-trainee';
      default: return '';
    }
  }

  isProcessing(id: string): boolean {
    return this.processingId === id;
  }

  formatCurrency(value?: number): string {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  }

  closeDialog() {
    this.showGroupDialog = false;
    this.showMemberDialog = false;
    this.showRoleDialog = false;
    this.showEditMemberDialog = false;
    this.editingMember = null;
  }
}
