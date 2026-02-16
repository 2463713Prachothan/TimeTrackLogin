import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManagerDataService } from '../../../core/services/manager-data.service';
import { UserService } from '../../../core/services/user.service';
import { TaskSubmissionService } from '../../../core/services/task-submission.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { TaskSubmission, TaskService } from '../../../core/services/task.service';
import { Subject, takeUntil } from 'rxjs';

interface TeamMember {
  userId: string;
  name: string;
}

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
  private apiService = inject(ApiService);
  private taskService = inject(TaskService);
  private destroy$ = new Subject<void>();

  isSubmitting = false;
  editingTaskId: number | null = null;

  showModal = false;
  showApprovalModal = false;
  showEditModal = false;
  tasks: any[] = [];
  teamMembers: TeamMember[] = [];
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

    // Load team members from API
    this.apiService.getMyTeam().pipe(takeUntil(this.destroy$)).subscribe({
      next: (members: any[]) => {
        this.teamMembers = members.map(m => ({
          userId: m.userId || m.id,
          name: m.name || m.fullName
        }));

        // Set default assignee to first team member's userId
        if (this.teamMembers.length > 0 && !this.newTask.assignedTo) {
          this.newTask.assignedTo = this.teamMembers[0].userId;
        }

        console.log('Team members loaded from API:', this.teamMembers);
      },
      error: (err) => {
        console.error('Error loading team members:', err);
      }
    });

    // Load tasks created by this manager from API
    this.loadTasksFromApi();

    // Subscribe to tasks and dynamically update when they change
    this.dataService.tasks$.pipe(takeUntil(this.destroy$)).subscribe((data: any[]) => {
      console.log('Tasks updated:', data);
      this.tasks = data;
    });

    // Subscribe to task submissions
    this.submissionService.getSubmissions().pipe(takeUntil(this.destroy$)).subscribe((submissions: TaskSubmission[]) => {
      console.log('📝 Manager - All submissions from service:', submissions);
      const teamMemberNames = this.teamMembers.map(m => m.name);
      console.log('👥 Manager - Team member names:', teamMemberNames);
      this.taskSubmissions = this.submissionService.getTeamSubmissions(teamMemberNames);
      console.log('✅ Manager - Filtered team submissions:', this.taskSubmissions);
    });
    
    // Periodically refresh submissions to ensure we get latest updates
    setInterval(() => {
      console.log('🔄 Manager - Refreshing submissions...');
      const teamMemberNames = this.teamMembers.map(m => m.name);
      this.taskSubmissions = this.submissionService.getTeamSubmissions(teamMemberNames);
    }, 5000); // Refresh every 5 seconds
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
   * Load tasks created by this manager from API
   */
  private loadTasksFromApi(): void {
    this.apiService.getTasksCreatedByMe().pipe(takeUntil(this.destroy$)).subscribe({
      next: (tasks: any[]) => {
        console.log('Tasks loaded from API:', tasks);
        this.tasks = tasks;
      },
      error: (err) => {
        console.error('Error loading tasks:', err);
      }
    });
  }

  /**
   * Refresh tasks list from API
   */
  refreshTasks(): void {
    this.loadTasksFromApi();
  }

  /**
   * Refresh submissions list from service
   */
  refreshSubmissions(): void {
    console.log('🔄 Manager.refreshSubmissions - Refreshing submissions list');
    const teamMemberNames = this.teamMembers.map(m => m.name);
    this.taskSubmissions = this.submissionService.getTeamSubmissions(teamMemberNames);
    console.log('✅ Manager.refreshSubmissions - Updated submissions:', this.taskSubmissions);
    this.notificationService.success('Submissions refreshed');
  }

  /**
   * Submit task to API
   * Sends assignedToUserId and estimatedHours to POST /api/Task
   */
  submitTask(): void {
    // Validate form
    if (!this.newTask.title.trim()) {
      this.notificationService.error('Please enter a task title');
      return;
    }

    // If no assignee selected, auto-assign to first team member
    if (!this.newTask.assignedTo && this.teamMembers.length > 0) {
      this.newTask.assignedTo = this.teamMembers[0].userId;
    }

    if (!this.newTask.assignedTo) {
      this.notificationService.error('Please select a team member to assign the task');
      return;
    }

    this.isSubmitting = true;

    // Build payload with AssignedToUserId and estimatedHours
    const payload = {
      title: this.newTask.title,
      description: this.newTask.description,
      AssignedToUserId: this.newTask.assignedTo,
      estimatedHours: Number(this.newTask.hours),
      status: this.newTask.status,
      priority: this.newTask.priority,
      dueDate: this.newTask.dueDate ? new Date(this.newTask.dueDate).toISOString() : null
    };

    console.log('Submitting task payload:', payload);

    this.apiService.createTask(payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        console.log('Task created successfully:', response);
        this.isSubmitting = false;
        
        // Show success notification
        this.notificationService.success('Task created successfully');
        
        // Close modal and reset form
        this.showModal = false;
        this.resetForm();
        
        // Refresh task list from API
        this.loadTasksFromApi();
      },
      error: (err: any) => {
        console.error('Error creating task:', err);
        this.isSubmitting = false;
        
        // Extract error message
        const errorMessage = err?.error?.message || err?.error?.title || err?.error?.detail || 'Failed to create task';
        this.notificationService.error(errorMessage);
      }
    });
  }

  /**
   * Add new task with auto-assignment (calls submitTask)
   */
  addTask(): void {
    this.submitTask();
  }

  /**
   * Delete task with confirmation - calls DELETE /api/Task/{id}
   */
  deleteTask(task: any) {
    const taskId = task.taskId || task.id;
    this.onDeleteTask(taskId);
  }

  /**
   * Delete task by ID with confirmation dialog
   */
  onDeleteTask(id: any): void {
    // Validate ID exists
    if (!id && id !== 0) {
      console.error('Cannot delete task: ID is missing or undefined', id);
      this.notificationService.error('Cannot delete task: ID is missing');
      return;
    }

    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    console.log('Deleting task with ID:', id);

    this.taskService.deleteTaskById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Task deleted successfully');
          this.notificationService.success('Task deleted successfully');
          this.loadTasksFromApi();
        },
        error: (err: any) => {
          console.error('Error deleting task:', err);
          const errorMessage = err?.error?.message || err?.error?.title || err?.error?.detail || 'Failed to delete task';
          this.notificationService.error(errorMessage);
        }
      });
  }

  /**
   * Open edit modal for a task (onEditTask)
   * Syncs database data with form controls
   */
  openEditModal(task: any) {
    console.log('Opening edit modal for task:', task);
    
    this.selectedTask = task;
    // Use taskId (database ID) for editing
    this.editingTaskId = task.taskId || task.id;
    
    // Map task properties to form, handling null values
    this.editTask = {
      title: task.title || '',
      description: task.description || '',
      // Use assignedToUserId from API, fallback to assignedTo
      assignedTo: task.assignedToUserId || task.assignedTo || '',
      // Use estimatedHours from API, fallback to hours
      hours: task.estimatedHours ?? task.hours ?? 8,
      status: task.status || 'Pending',
      priority: task.priority || 'Medium',
      // Handle date formatting - ensure proper format for input[type=date]
      dueDate: this.formatDateForInput(task.dueDate)
    };
    
    console.log('Edit form populated with:', this.editTask);
    this.showEditModal = true;
  }

  /**
   * Format date for HTML date input
   */
  private formatDateForInput(date: any): string {
    if (!date) return '';
    
    try {
      if (typeof date === 'string') {
        // If ISO string, extract date part
        return date.split('T')[0];
      } else if (date instanceof Date) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      console.error('Error formatting date:', e);
    }
    return '';
  }

  /**
   * Alias for openEditModal
   */
  onEditTask(task: any): void {
    this.openEditModal(task);
  }

  /**
   * Close edit modal
   */
  closeEditModal() {
    this.showEditModal = false;
    this.selectedTask = null;
    this.editingTaskId = null;
    this.resetEditForm();
  }

  /**
   * Save edited task - calls PUT /api/Task/{id}
   */
  saveEditTask() {
    // Validate editingTaskId
    if (!this.editingTaskId && this.editingTaskId !== 0) {
      console.error('Cannot update task: editingTaskId is missing');
      this.notificationService.error('Cannot update task: Task ID is missing');
      return;
    }

    if (!this.editTask.title.trim()) {
      this.notificationService.error('Please enter a task title');
      return;
    }

    this.isSubmitting = true;

    // Build payload matching API expectations
    // Handle null values properly (e.g., ProjectId can be null)
    const updatedTask = {
      title: this.editTask.title,
      description: this.editTask.description || null,
      AssignedToUserId: this.editTask.assignedTo || null,
      estimatedHours: this.editTask.hours ? Number(this.editTask.hours) : null,
      status: this.editTask.status,
      priority: this.editTask.priority,
      dueDate: this.editTask.dueDate ? new Date(this.editTask.dueDate).toISOString() : null
    };

    // Log form values before PUT call for debugging
    console.log('Updating task ID:', this.editingTaskId);
    console.log('Form values being sent:', JSON.stringify(updatedTask, null, 2));

    this.taskService.updateTaskById(this.editingTaskId, updatedTask)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('Task updated successfully:', response);
          this.isSubmitting = false;
          this.notificationService.success('Task updated successfully');
          this.closeEditModal();
          this.loadTasksFromApi();
        },
        error: (err: any) => {
          console.error('Error updating task:', err);
          console.error('Error response body:', err?.error);
          this.isSubmitting = false;
          const errorMessage = err?.error?.message || err?.error?.title || err?.error?.detail || 'Failed to update task';
          this.notificationService.error(errorMessage);
        }
      });
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
    const taskTitle = this.selectedSubmission.taskTitle;

    switch (this.approvalForm.status) {
      case 'Approved':
        console.log('📋 Manager approving submission:', submissionId);
        this.approveTaskCompletion(this.selectedSubmission);
        this.notificationService.success(`✅ Task "${taskTitle}" has been approved!`);
        break;
        
      case 'Rejected':
        console.log('❌ Manager rejecting submission:', submissionId);
        this.submissionService.rejectSubmission(
          submissionId,
          this.currentManagerName,
          this.approvalForm.comments
        );
        this.notificationService.success(`❌ Task "${taskTitle}" has been rejected.`);
        break;
        
      case 'Need Changes':
        console.log('⚠️ Manager requesting changes on submission:', submissionId);
        this.submissionService.needsChanges(
          submissionId,
          this.currentManagerName,
          this.approvalForm.comments
        );
        this.notificationService.success(`⚠️ Requested changes for task "${taskTitle}".`);
        break;
    }

    this.closeApprovalModal();
    this.loadTasksFromApi();
  }

  /**
   * Approve task completion (manager action)
   * Updates task to mark as approved and increments completed count
   */
  approveTaskCompletion(submission: TaskSubmission) {
    if (!submission.taskId) {
      this.notificationService.error('Invalid task ID');
      return;
    }

    this.isSubmitting = true;
    const taskId = submission.taskId;
    const approvalComments = this.approvalForm.comments;

    console.log('📋 Manager.approveTaskCompletion - Approving task:', taskId, 'Comments:', approvalComments);

    // Prepare update payload with Completed status
    const updatePayload = {
      status: 'Completed',
      approvalComments: approvalComments
    };

    this.taskService.updateTaskById(taskId, updatePayload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('✅ Manager.approveTaskCompletion - Task approved:', response);
          
          // Update local tasks list immediately
          const taskIndex = this.tasks.findIndex(t => t.id === taskId || t.taskId === taskId);
          if (taskIndex !== -1) {
            this.tasks[taskIndex].status = 'Completed';
            console.log('✅ Manager - Task status updated to Completed in local list');
          }
          
          // Approve submission in service
          this.submissionService.approveSubmission(
            submission.id!,
            this.currentManagerName,
            approvalComments
          );
          
          // Reload tasks from API to ensure sync
          setTimeout(() => {
            this.loadTasksFromApi();
          }, 500);
          
          this.notificationService.success('✅ Task completion approved! Completed count updated.');
          this.isSubmitting = false;
        },
        error: (err: any) => {
          console.error('❌ Manager.approveTaskCompletion - Error approving task:', err);
          const message = err.error?.message || err.error || 'Failed to approve task';
          this.notificationService.error(message);
          this.isSubmitting = false;
        }
      });
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
   * Get pending submissions count
   */
  getPendingSubmissionsCount(): number {
    return this.taskSubmissions.filter(s => s.approvalStatus === 'Pending').length;
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