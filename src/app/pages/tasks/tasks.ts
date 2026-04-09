import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ApiService } from '../../services/api';
import { AuthService } from '../../services/auth/auth.service';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: string;
  assignedToUserId?: string;
  assignedTo?: { id: string; name: string; photo?: string };
  dueDate?: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  photo?: string;
  role: string;
}

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule,
    FormsModule,
    DragDropModule
  ],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css'
})
export class TasksComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  reviewTasks: Task[] = [];
  doneTasks: Task[] = [];

  taskArrays: { [key: string]: Task[] } = {
    'todo': [],
    'in_progress': [],
    'review': [],
    'done': []
  };

  loading = true;
  currentUserName = '';
  currentUser: any = null;
  isAdmin = false;
  showAssignmentDropdown = false;

  constructor() {
    const user = this.auth.currentUser();
    this.currentUser = user;
    this.currentUserName = user?.name || 'Unassigned';
    const userRole = user?.role || '';
    this.isAdmin = userRole === 'Super Admin';
    this.showAssignmentDropdown = this.isAdmin;
  }

  columns = [
    { id: 'todo', label: 'To Do', color: '#6b7280' },
    { id: 'in_progress', label: 'In Progress', color: '#3b82f6' },
    { id: 'review', label: 'Review', color: '#f59e0b' },
    { id: 'done', label: 'Done', color: '#10b981' }
  ];

  priorities = ['low', 'medium', 'high', 'urgent'];
  priorityColors: any = {
    low: '#6b7280',
    medium: '#3b82f6',
    high: '#f59e0b',
    urgent: '#ef4444'
  };

  showAddDialog = false;
  users: User[] = [];
  newTask: Partial<Task> = {
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    assignedToUserId: ''
  };

  ngOnInit() {
    const user = this.auth.currentUser();
    if (!this.newTask.assignedToUserId && user?.id) {
      this.newTask.assignedToUserId = user.id;
    }
    
    this.fetchTasks();
    this.fetchUsers();
  }

  fetchUsers() {
    this.api.getUsers().subscribe({
      next: (res: any) => {
        let userList: any[] = [];
        if (Array.isArray(res)) {
          userList = res;
        } else if (res?.data && Array.isArray(res.data)) {
          userList = res.data;
        } else if (res?.users && Array.isArray(res.users)) {
          userList = res.users;
        }
        this.users = userList.map(u => ({
          id: u.id || u._id,
          name: u.name,
          photo: u.photo,
          role: u.role
        }));
      },
      error: (err) => {
        console.error('Failed to fetch users', err);
        this.users = [];
      }
    });
  }

  fetchTasks() {
    this.loading = true;
    this.api.getTasks().subscribe({
      next: (res) => {
        this.distributeTasks(res);
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to fetch tasks', err);
        this.loading = false;
        this.distributeTasks(this.getMockTasks());
      }
    });
  }

  distributeTasks(tasks: Task[]) {
    if (!tasks) tasks = [];
    this.taskArrays = {
      'todo': (tasks || []).filter((t: any) => t.status === 'todo'),
      'in_progress': (tasks || []).filter((t: any) => t.status === 'in_progress'),
      'review': (tasks || []).filter((t: any) => t.status === 'review'),
      'done': (tasks || []).filter((t: any) => t.status === 'done')
    };
  }

  getTaskArray(status: string): Task[] {
    const arr = this.taskArrays[status];
    if (!arr || !Array.isArray(arr)) {
      return [];
    }
    return arr;
  }

  getPriorityClass(priority: string): string {
    return `priority-${priority}`;
  }

  drop(event: CdkDragDrop<Task[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      const newStatus = event.container.id as Task['status'];
      
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      this.updateTaskStatus(task, newStatus);
    }
  }

  createTask() {
    if (!this.newTask.title?.trim()) {
      this.snackBar.open('Task title is required', 'Close', { duration: 3000 });
      return;
    }

    const taskData: any = {
      ...this.newTask,
      status: 'todo',
      createdAt: new Date().toISOString(),
      assignee: this.currentUserName
    };

    if (this.newTask.assignedToUserId) {
      taskData.assignedToUserId = this.newTask.assignedToUserId;
    }

    this.api.createTask(taskData).subscribe({
      next: (res) => {
        this.taskArrays['todo'].push(res);
        this.showAddDialog = false;
        this.newTask = { title: '', description: '', priority: 'medium', status: 'todo', assignedToUserId: '' };
        this.snackBar.open('Task created successfully', 'Close', { duration: 3000 });
      },
      error: (err) => {
        const newTask: Task = { ...taskData, id: Date.now().toString() } as Task;
        this.taskArrays['todo'].push(newTask);
        this.showAddDialog = false;
        this.snackBar.open('Task created (local)', 'Close', { duration: 3000 });
      }
    });
  }

  updateTaskStatus(task: Task, newStatus: string) {
    const oldStatus = task.status;
    task.status = newStatus as Task['status'];

    this.api.updateTask(task.id, { status: newStatus }).subscribe({
      next: () => {
        this.snackBar.open('Task updated', 'Close', { duration: 2000 });
      },
      error: (err) => {
        task.status = oldStatus;
        transferArrayItem(
          this.getTaskArray(newStatus),
          this.getTaskArray(oldStatus),
          this.getTaskArray(newStatus).indexOf(task),
          this.getTaskArray(oldStatus).length
        );
        this.snackBar.open('Failed to update task', 'Close', { duration: 3000 });
      }
    });
  }

  assignTask(task: Task, userId: string) {
    const user = this.users.find(u => u.id === userId);
    
    this.api.updateTask(task.id, { assignedToUserId: userId }).subscribe({
      next: (res) => {
        task.assignedToUserId = userId;
        task.assignedTo = user;
        this.snackBar.open(`Task assigned to ${user?.name || 'user'}`, 'Close', { duration: 2000 });
      },
      error: (err) => {
        task.assignedToUserId = task.assignedToUserId;
        task.assignedTo = task.assignedTo;
        this.snackBar.open('Failed to assign task', 'Close', { duration: 3000 });
      }
    });
  }

  removeTaskFromArray(task: Task, status: string) {
    const arr = this.taskArrays[status];
    if (arr) {
      const index = arr.findIndex(t => t.id === task.id);
      if (index > -1) {
        arr.splice(index, 1);
      }
    }
  }

  deleteTask(taskId: string) {
    let taskStatus = 'todo';
    let task = this.taskArrays['todo']?.find(t => t.id === taskId);
    if (!task) {
      task = this.taskArrays['in_progress']?.find(t => t.id === taskId);
      taskStatus = 'in_progress';
    }
    if (!task) {
      task = this.taskArrays['review']?.find(t => t.id === taskId);
      taskStatus = 'review';
    }
    if (!task) {
      task = this.taskArrays['done']?.find(t => t.id === taskId);
      taskStatus = 'done';
    }

    this.api.deleteTask(taskId).subscribe({
      next: () => {
        this.removeTaskFromArray(task!, taskStatus);
        this.snackBar.open('Task deleted', 'Close', { duration: 2000 });
      },
      error: (err) => {
        this.removeTaskFromArray(task!, taskStatus);
        this.snackBar.open('Task deleted (local)', 'Close', { duration: 2000 });
      }
    });
  }

  openAssignDialog(task: Task) {
    const userId = prompt(`Assign task "${task.title}" to user ID:`);
    if (userId) {
      this.assignTask(task, userId);
    }
  }

  closeDialog() {
    this.showAddDialog = false;
    this.newTask = { title: '', description: '', priority: 'medium', status: 'todo' };
  }

  isOverdue(dueDate?: string): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  }

  getMockTasks(): Task[] {
    return [
      { id: '1', title: 'Prepare monthly report', description: 'Generate sales report for January', status: 'todo', priority: 'high', assignee: 'John Doe', dueDate: '2026-03-20', createdAt: '2026-03-01' },
      { id: '2', title: 'Client follow-up', description: 'Follow up with potential buyers', status: 'in_progress', priority: 'medium', assignee: 'Jane Smith', dueDate: '2026-03-15', createdAt: '2026-03-10' },
      { id: '3', title: 'Property photoshoot', description: 'Schedule photos for new listings', status: 'review', priority: 'urgent', assignee: 'Mike Johnson', dueDate: '2026-03-14', createdAt: '2026-03-08' },
      { id: '4', title: 'Update CRM data', description: 'Clean up old leads', status: 'done', priority: 'low', assignee: 'Sarah Wilson', createdAt: '2026-03-01' },
      { id: '5', title: 'Team meeting preparation', description: 'Prepare agenda for weekly meeting', status: 'todo', priority: 'medium', assignee: 'John Doe', dueDate: '2026-03-16', createdAt: '2026-03-12' }
    ];
  }
}
