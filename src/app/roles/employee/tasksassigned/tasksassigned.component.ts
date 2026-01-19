import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Required for ngClass/ngStyle in older versions
import { TaskService, Task } from '../../../core/services/task.service';
import { NotificationService } from '../../../core/services/notification.service';

interface TaskDisplay {
  name: string;
  status: string;
  currentHours: number;
  totalHours: number;
  progress: number;
  icon: string;
  statusClass: string;
  iconClass: string;
}

@Component({
  selector: 'app-tasksassigned',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tasksassigned.component.html',
  styleUrls: ['./tasksassigned.component.css']
})
export class TasksComponent implements OnInit {
  // Inject services
  private taskService = inject(TaskService);
  private notificationService = inject(NotificationService);

  activeTab: string = 'My Tasks';
  stats = [
    { label: 'Pending', value: '0 tasks', icon: 'fa-regular fa-circle', class: 'icon-gray' },
    { label: 'In Progress', value: '0 tasks', icon: 'fa-regular fa-clock', class: 'icon-blue' },
    { label: 'Completed', value: '0 tasks', icon: 'fa-regular fa-circle-check', class: 'icon-green' }
  ];

  taskList: TaskDisplay[] = [];

  ngOnInit() {
    this.loadTasks();
  }

  /**
   * Load tasks from TaskService and transform them for display
   */
  private loadTasks() {
    this.taskService.getTasks().subscribe(
      (tasks: Task[]) => {
        // Transform service data to display format
        this.taskList = tasks.map(task => ({
          name: task.title,
          status: task.status,
          currentHours: this.getProgressHours(task.status, task.hours),
          totalHours: task.hours,
          progress: this.getProgressPercentage(task.status),
          icon: this.getStatusIcon(task.status),
          statusClass: this.getStatusClass(task.status),
          iconClass: this.getIconClass(task.status)
        }));

        // Update statistics
        this.updateStats(tasks);
      },
      (error) => {
        console.error('Error loading tasks:', error);
        this.notificationService.error('Failed to load tasks');
      }
    );
  }

  /**
   * Calculate progress hours based on status
   */
  private getProgressHours(status: string, totalHours: number): number {
    if (status === 'Completed') return totalHours;
    if (status === 'In Progress') return totalHours * 0.8; // Assume 80% done
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