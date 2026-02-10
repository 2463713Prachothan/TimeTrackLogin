import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManagerDataService } from '../../../core/services/manager-data.service';
import { UserService } from '../../../core/services/user.service';
import { TaskSubmissionService } from '../../../core/services/task-submission.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { TaskSubmission } from '../../../core/services/task.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-task-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-management.component.html',
  styleUrls: ['./task-management.component.css']
})
export class TaskManagementComponent implements OnInit, OnDestroy {
  private dataService = inject(ManagerDataService);
  private userService = inject(UserService);
  private submissionService = inject(TaskSubmissionService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  showModal = false;
  showApprovalModal = false;
  showEditModal = false;
  tasks: any[] = [];
  teamMembers: string[] = [];
  taskSubmissions: TaskSubmission[] = [];
  currentManagerName: string = '';
  activeTab: string = 'Manage Tasks';

  selectedSubmission: TaskSubmission | null = null;
  selectedTask: any = null;
  approvalForm = {
    status: 'Approved' as 'Approved' | 'Rejected' | 'Need Changes',
    comments: '',
    reassignDate: ''
  };

  newTask = {
    title: '',
    description: '',
    assignedTo: '',
    hours: 8,
    status: 'Pending',
    priority: 'Medium' as 'Low' | 'Medium' | 'High',
    dueDate: ''
  };

  editTask = {
    title: '',
    description: '',
    assignedTo: '',
    hours: 8,
    status: 'Pending',
    priority: 'Medium' as 'Low' | 'Medium' | 'High',
    dueDate: ''
  };

  ngOnInit() {
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.currentManagerName = currentUser.fullName;
    }

    // Get current manager ID from session
    const currentManagerId = this.getCurrentManagerId();

    // Load assigned employees once and use as team members
    this.userService.getUsers().pipe(takeUntil(this.destroy$)).subscribe((users: any[]) => {
      const currentManager = users.find(u => u.id === currentManagerId);
      
      if (currentManager && currentManager.assignedEmployees && currentManager.assignedEmployees.length > 0) {
        // Get full names of assigned employees
        const assignedEmployees = users.filter(u => 
          currentManager.assignedEmployees.includes(u.id)
        );
        this.teamMembers = assignedEmployees.map(emp => emp.fullName);

        // Set default assignee to first team member
        if (this.teamMembers.length > 0 && !this.newTask.assignedTo) {
          this.newTask.assignedTo = this.teamMembers[0];
        }

        console.log('Team members loaded:', this.teamMembers);
      }
    });

    // Subscribe to tasks and dynamically update when they change
    this.dataService.tasks$.pipe(takeUntil(this.destroy$)).subscribe((data: any[]) => {
      console.log('Tasks updated:', data);
      this.tasks = data;
    });

    // Subscribe to task submissions
    this.submissionService.getSubmissions().pipe(takeUntil(this.destroy$)).subscribe((submissions: TaskSubmission[]) => {
      this.taskSubmissions = this.submissionService.getTeamSubmissions(this.teamMembers);
      console.log('Submissions updated:', this.taskSubmissions);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Get current manager ID from session
   */
  private getCurrentManagerId(): string {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('user_session');
      if (saved) {
        const user = JSON.parse(saved);
        return user.id || '';
      }
    }
    return '';
  }

  /**
   * Add new task with auto-assignment
   */
  addTask() {
    if (this.newTask.title.trim()) {
      // If no assignee selected, auto-assign to first team member
      if (!this.newTask.assignedTo && this.teamMembers.length > 0) {
        this.newTask.assignedTo = this.teamMembers[0];
      }

      // Create task with all required fields
      const task = {
        title: this.newTask.title,
        description: this.newTask.description,
        assignedTo: this.newTask.assignedTo,
        hours: this.newTask.hours,
        status: this.newTask.status,
        priority: this.newTask.priority,
        dueDate: this.newTask.dueDate || new Date().toISOString().split('T')[0]
      };

      console.log('Adding task:', task);
      this.dataService.addTask(task);
      this.notificationService.success('Task created successfully');
      this.showModal = false;
      this.resetForm();
    }
  }

  /**
   * Delete task with confirmation
   */
  deleteTask(task: any) {
    if (confirm('Are you sure you want to delete this task?')) {
      console.log('Deleting task:', task.id);
      this.dataService.deleteTask(task.id);
      this.notificationService.success('Task deleted');
    }
  }

  /**
   * Open edit modal for a task
   */
  openEditModal(task: any) {
    this.selectedTask = task;
    this.editTask = {
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo,
      hours: task.hours,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate
    };
    this.showEditModal = true;
  }

  /**
   * Close edit modal
   */
  closeEditModal() {
    this.showEditModal = false;
    this.selectedTask = null;
    this.resetEditForm();
  }

  /**
   * Save edited task
   */
  saveEditTask() {
    if (!this.selectedTask || !this.editTask.title.trim()) {
      this.notificationService.error('Please fill in all required fields');
      return;
    }

    const updatedTask = {
      title: this.editTask.title,
      description: this.editTask.description,
      assignedTo: this.editTask.assignedTo,
      hours: this.editTask.hours,
      status: this.editTask.status,
      priority: this.editTask.priority,
      dueDate: this.editTask.dueDate
    };

    this.dataService.updateTask(this.selectedTask.id, updatedTask);
    this.notificationService.success('Task updated successfully');
    this.closeEditModal();
  }

  /**
   * Reset edit form
   */
  private resetEditForm() {
    this.editTask = {
      title: '',
      description: '',
      assignedTo: '',
      hours: 8,
      status: 'Pending',
      priority: 'Medium',
      dueDate: ''
    };
  }

  /**
   * Open approval modal for a submission
   */
  openApprovalModal(submission: TaskSubmission) {
    this.selectedSubmission = submission;
    this.approvalForm = {
      status: 'Approved',
      comments: '',
      reassignDate: submission.reassignDate || ''
    };
    this.showApprovalModal = true;
  }

  /**
   * Close approval modal
   */
  closeApprovalModal() {
    this.showApprovalModal = false;
    this.selectedSubmission = null;
    this.approvalForm = {
      status: 'Approved',
      comments: '',
      reassignDate: ''
    };
  }

  /**
   * Process task submission approval
   */
  processSubmission() {
    if (!this.selectedSubmission || !this.selectedSubmission.id) {
      this.notificationService.error('Invalid submission');
      return;
    }

    const submissionId = this.selectedSubmission.id;

    switch (this.approvalForm.status) {
      case 'Approved':
        console.log('Manager approving submission:', submissionId);
        this.submissionService.approveSubmission(
          submissionId,
          this.currentManagerName,
          this.approvalForm.comments
        );
        this.notificationService.success('Task approved');
        break;

      case 'Rejected':
        this.submissionService.rejectSubmission(
          submissionId,
          this.currentManagerName,
          this.approvalForm.comments
        );
        this.notificationService.success('Task rejected');
        break;

      case 'Need Changes':
        this.submissionService.needsChanges(
          submissionId,
          this.currentManagerName,
          this.approvalForm.comments
        );
        this.notificationService.success('Requested changes from employee');
        break;
    }

    // Force reload tasks to ensure updated status is reflected
    console.log('🔄 Refreshing tasks after submission processing');
    // Add a small delay to allow the task update to complete
    setTimeout(() => {
      this.dataService.refreshTasks();
      this.closeApprovalModal();
    }, 500);
  }

  /**
   * Reassign task to different date
   */
  reassignTaskDate() {
    if (!this.selectedSubmission || !this.selectedSubmission.id) {
      this.notificationService.error('Invalid submission');
      return;
    }

    if (!this.approvalForm.reassignDate) {
      this.notificationService.error('Please select a new date');
      return;
    }

    this.submissionService.reassignTask(
      this.selectedSubmission.id,
      this.currentManagerName,
      this.approvalForm.reassignDate,
      this.approvalForm.comments
    );
    this.notificationService.success('Task reassigned to new date');
    this.closeApprovalModal();
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
   * Get submission status class
   */
  getStatusClass(status: string): string {
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
   * Get completion status class
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
   * Count tasks by status
   */
  getCount(status: string) {
    return this.tasks.filter(t => t.status === status).length;
  }

  /**
   * Get pending tasks
   */
  get pendingTasks() {
    return this.tasks.filter(t => t.status === 'Pending');
  }

  /**
   * Get pending submissions count
   */
  getPendingSubmissionsCount(): number {
    return this.taskSubmissions.filter(s => s.approvalStatus === 'Pending').length;
  }
  /**
   * Reset form to default values
   */
  resetForm() {
    this.newTask = {
      title: '',
      description: '',
      assignedTo: '',
      hours: 8,
      status: 'Pending',
      priority: 'Medium',
      dueDate: ''
    };
  }
}