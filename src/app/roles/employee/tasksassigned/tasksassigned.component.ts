import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService, Task, TaskSubmission } from '../../../core/services/task.service';
import { TaskSubmissionService } from '../../../core/services/task-submission.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { Subject, takeUntil } from 'rxjs';

interface TaskDisplay {
  id?: string;
  taskId?: string;
  name: string;
  description: string;
  status: string;
  currentHours: number;
  totalHours: number;
  progress: number;
  icon: string;
  statusClass: string;
  iconClass: string;
  priority: string;
  dueDate?: string;
  assignedDate?: Date;
}

@Component({
  selector: 'app-tasksassigned',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tasksassigned.component.html',
  styleUrls: ['./tasksassigned.component.css']
})
export class TasksComponent implements OnInit, OnDestroy {
  // Inject services
  private taskService = inject(TaskService);
  private taskSubmissionService = inject(TaskSubmissionService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private destroy$ = new Subject<void>();

  activeTab: string = 'My Tasks';
  isLoadingTasks = false;
  assignedTasks: any[] = [];
  stats = [
    { label: 'Pending', value: '0 tasks', icon: 'fa-regular fa-circle', class: 'icon-gray' },
    { label: 'In Progress', value: '0 tasks', icon: 'fa-regular fa-clock', class: 'icon-blue' },
    { label: 'Completed', value: '0 tasks', icon: 'fa-regular fa-circle-check', class: 'icon-green' }
  ];

  taskList: TaskDisplay[] = [];
  submissionHistory: TaskSubmission[] = [];

  // Modal and form properties
  showSubmissionModal = false;
  selectedTask: TaskDisplay | null = null;
  submissionForm = {
    completionStatus: 'Completed' as 'Completed' | 'In Progress' | 'Not Started',
    hoursSpent: 0,
    comments: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High'
  };

  currentUser: string = '';

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.currentUser = user.fullName;
    }
    this.loadTasks();
    this.loadSubmissionHistory();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load tasks from API using /api/Task/my-tasks endpoint
   */
  private loadTasks() {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      console.error('❌ Employee.loadTasks - No current user found');
      return;
    }

    this.isLoadingTasks = true;
    console.log('✅ Employee.loadTasks - Fetching tasks from API for user:', currentUser.fullName);

    // Use taskService.getMyTasks() which calls /api/Task/my-tasks
    this.taskService.getMyTasks().pipe(takeUntil(this.destroy$)).subscribe({
      next: (tasks: any[]) => {
        console.log(`✅ Employee.loadTasks - Received ${tasks.length} tasks from API`);
        
        // Store raw tasks from API
        this.assignedTasks = tasks;
        
        // Transform to display format
        this.taskList = tasks.map(task => ({
          id: task.id,
          taskId: task.taskId || task.displayTaskId,
          name: task.title,
          description: task.description || '',
          status: task.status || 'Pending',
          currentHours: this.getProgressHours(task.status, task.estimatedHours || task.hours || 0),
          totalHours: task.estimatedHours || task.hours || 0,
          progress: this.getProgressPercentage(task.status),
          icon: this.getStatusIcon(task.status),
          statusClass: this.getStatusClass(task.status),
          iconClass: this.getIconClass(task.status),
          priority: task.priority || 'Medium',
          dueDate: task.dueDate,
          assignedDate: task.createdDate
        }));

        // Update statistics
        this.updateStatsFromAssignedTasks();
        this.isLoadingTasks = false;
      },
      error: (err) => {
        console.error('❌ Employee.loadTasks - Error loading tasks:', err);
        this.notificationService.error('Failed to load tasks');
        this.isLoadingTasks = false;
      }
    });
  }

  /**
   * Update statistics based on assigned tasks
   */
  private updateStatsFromAssignedTasks() {
    const pendingCount = this.assignedTasks.filter(t => t.status === 'Pending').length;
    const inProgressCount = this.assignedTasks.filter(t => t.status === 'In Progress').length;
    const completedCount = this.assignedTasks.filter(t => t.status === 'Completed').length;

    this.stats = [
      { label: 'Pending', value: `${pendingCount} tasks`, icon: 'fa-regular fa-circle', class: 'icon-gray' },
      { label: 'In Progress', value: `${inProgressCount} tasks`, icon: 'fa-regular fa-clock', class: 'icon-blue' },
      { label: 'Completed', value: `${completedCount} tasks`, icon: 'fa-regular fa-circle-check', class: 'icon-green' }
    ];
  }

  /**
   * Load submission history for current employee
   */
  private loadSubmissionHistory() {
    this.taskSubmissionService.getSubmissions().pipe(takeUntil(this.destroy$)).subscribe(
      (submissions: TaskSubmission[]) => {
        this.submissionHistory = this.taskSubmissionService.getSubmissionsByEmployee(this.currentUser);
      }
    );
  }

  /**
   * Open task submission modal
   */
  openSubmissionModal(task: TaskDisplay) {
    this.selectedTask = task;
    this.submissionForm = {
      completionStatus: 'Completed',
      hoursSpent: task.totalHours,
      comments: '',
      priority: task.priority as 'Low' | 'Medium' | 'High'
    };
    this.showSubmissionModal = true;
  }

  /**
   * Open submission modal from raw task object (from API)
   */
  openSubmissionModalFromTask(task: any) {
    // Convert raw API task to TaskDisplay format
    const taskDisplay: TaskDisplay = {
      id: task.id,
      taskId: task.displayTaskId || task.taskId,
      name: task.title,
      description: task.description || '',
      status: task.status || 'Pending',
      currentHours: this.getProgressHours(task.status, task.estimatedHours || 0),
      totalHours: task.estimatedHours || task.hours || 0,
      progress: this.getProgressPercentage(task.status),
      icon: this.getStatusIcon(task.status),
      statusClass: this.getStatusClass(task.status),
      iconClass: this.getIconClass(task.status),
      priority: task.priority || 'Medium',
      dueDate: task.dueDate
    };
    this.openSubmissionModal(taskDisplay);
  }

  /**
   * Close modal
   */
  closeModal() {
    this.showSubmissionModal = false;
    this.selectedTask = null;
    this.submissionForm = {
      completionStatus: 'Completed',
      hoursSpent: 0,
      comments: '',
      priority: 'Medium'
    };
  }

  /**
   * Submit task completion
   */
  submitTaskCompletion() {
    if (!this.selectedTask || !this.currentUser) {
      this.notificationService.error('Invalid task or user');
      return;
    }

    if (this.submissionForm.hoursSpent <= 0) {
      this.notificationService.error('Hours spent must be greater than 0');
      return;
    }

    const submission: TaskSubmission = {
      taskId: this.selectedTask.taskId || this.selectedTask.id!,
      taskTitle: this.selectedTask.name,
      submittedBy: this.currentUser,
      submittedDate: new Date(),
      completionStatus: this.submissionForm.completionStatus,
      hoursSpent: this.submissionForm.hoursSpent,
      comments: this.submissionForm.comments,
      approvalStatus: 'Pending',
      priority: this.submissionForm.priority
    };

    this.taskSubmissionService.submitTaskCompletion(submission);
    this.notificationService.success('Task submission sent to manager for approval');
    this.closeModal();
    this.loadSubmissionHistory();
  }

  /**
   * Get status badge color for submission
   */
  getSubmissionStatusClass(status: string): string {
    switch (status) {
      case 'Approved':
        return 'badge-success';
      case 'Rejected':
        return 'badge-danger';
      case 'Need Changes':
        return 'badge-warning';
      case 'Pending':
        return 'badge-info';
      default:
        return 'badge-secondary';
    }
  }

  /**
   * Get completion status badge
   */
  getCompletionStatusClass(status: string): string {
    switch (status) {
      case 'Completed':
        return 'badge-success';
      case 'In Progress':
        return 'badge-warning';
      case 'Not Started':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  /**
   * Calculate progress hours based on status
   */
  private getProgressHours(status: string, totalHours: number): number {
    if (status === 'Completed') return totalHours;
    if (status === 'In Progress') return totalHours * 0.8;
    return 0;
  }

  /**
   * Get progress percentage based on status (public for template)
   */
  getProgressPercentage(status: string): number {
    if (status === 'Completed') return 100;
    if (status === 'In Progress') return 80;
    return 0;
  }

  /**
   * Get appropriate icon for status
   */
  private getStatusIcon(status: string): string {
    switch (status) {
      case 'Completed':
        return 'fa-regular fa-circle-check';
      case 'In Progress':
        return 'fa-regular fa-clock';
      default:
        return 'fa-solid fa-play';
    }
  }

  /**
   * Get CSS class for status badge
   */
  private getStatusClass(status: string): string {
    switch (status) {
      case 'Completed':
        return 'status-active';
      case 'In Progress':
        return 'badge-role manager';
      default:
        return 'badge-role employee';
    }
  }

  /**
   * Get CSS class for status icon
   */
  private getIconClass(status: string): string {
    switch (status) {
      case 'Completed':
        return 'icon-green';
      case 'In Progress':
        return 'icon-blue';
      default:
        return 'icon-gray';
    }
  }

  /**
   * Get priority badge class
   */
  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'High':
        return 'badge-danger';
      case 'Medium':
        return 'badge-warning';
      case 'Low':
        return 'badge-success';
      default:
        return 'badge-secondary';
    }
  }

  /**
   * Update statistics based on tasks
   */
  private updateStats(tasks: Task[]) {
    const pendingCount = tasks.filter(t => t.status === 'Pending').length;
    const inProgressCount = tasks.filter(t => t.status === 'In Progress').length;
    const completedCount = tasks.filter(t => t.status === 'Completed').length;

    this.stats = [
      { label: 'Pending', value: `${pendingCount} tasks`, icon: 'fa-regular fa-circle', class: 'icon-gray' },
      { label: 'In Progress', value: `${inProgressCount} tasks`, icon: 'fa-regular fa-clock', class: 'icon-blue' },
      { label: 'Completed', value: `${completedCount} tasks`, icon: 'fa-regular fa-circle-check', class: 'icon-green' }
    ];
  }
}