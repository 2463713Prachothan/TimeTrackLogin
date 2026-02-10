import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService, Task, TaskSubmission } from '../../../core/services/task.service';
import { TaskSubmissionService } from '../../../core/services/task-submission.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
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
  private destroy$ = new Subject<void>();

  activeTab: string = 'My Tasks';
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
   * Load tasks from TaskService and transform them for display
   */
  private loadTasks() {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      console.error('❌ Employee.loadTasks - No current user found');
      return;
    }

    const userFullName = currentUser.fullName;
    console.log('✅ Employee.loadTasks - Current User:', {
      fullName: currentUser.fullName,
      email: currentUser.email,
      role: currentUser.role,
      id: currentUser.id
    });

    this.taskService.getTasks().pipe(takeUntil(this.destroy$)).subscribe(
      (tasks: Task[]) => {
        console.log(`✅ Employee.loadTasks - Received ${tasks.length} total tasks from TaskService`);
        
        // Log detailed info for each task
        tasks.forEach((task, index) => {
          const matches = task.assignedTo?.toLowerCase() === userFullName?.toLowerCase();
          console.log(`   Task ${index}: "${task.title}"`, {
            id: task.id,
            taskId: task.taskId,
            assignedTo: `"${task.assignedTo}"`,
            assignedToLower: `"${task.assignedTo?.toLowerCase()}"`,
            userFullName: `"${userFullName}"`,
            userLower: `"${userFullName?.toLowerCase()}"`,
            matches: matches ? '✅ MATCH' : '❌ NO MATCH',
            status: task.status
          });
        });
        
        // Filter tasks assigned to current employee
        const assignedTasks = tasks.filter(
          task => task.assignedTo?.toLowerCase() === userFullName?.toLowerCase()
        );

        console.log(`📊 Employee.loadTasks - Found ${assignedTasks.length} task(s) assigned to "${userFullName}"`);

        // Transform service data to display format
        this.taskList = assignedTasks.map(task => ({
          id: task.id,
          taskId: task.taskId,
          name: task.title,
          description: task.description,
          status: task.status,
          currentHours: this.getProgressHours(task.status, task.hours),
          totalHours: task.hours,
          progress: this.getProgressPercentage(task.status),
          icon: this.getStatusIcon(task.status),
          statusClass: this.getStatusClass(task.status),
          iconClass: this.getIconClass(task.status),
          priority: task.priority,
          dueDate: task.dueDate,
          assignedDate: task.assignedDate
        }));

        // Update statistics (for assigned tasks only)
        this.updateStats(assignedTasks);
      },
      (error) => {
        console.error('Error loading tasks:', error);
        this.notificationService.error('Failed to load tasks');
      }
    );
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
   * Get progress percentage based on status
   */
  private getProgressPercentage(status: string): number {
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