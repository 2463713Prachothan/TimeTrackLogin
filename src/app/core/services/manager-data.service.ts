import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { TimeLogService } from './time-log.service';
import { TaskService } from './task.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class ManagerDataService {
  private platformId = inject(PLATFORM_ID);
  private timeLogService = inject(TimeLogService);
  private taskService = inject(TaskService);
  private userService = inject(UserService);

  // User session management
  private currentUserSubject = new BehaviorSubject<any>(this.getSavedUser());
  currentUser$ = this.currentUserSubject.asObservable();

  // Team members count - Initialize with calculation right away
  private teamMembersSubject: BehaviorSubject<number>;
  teamMembers$: Observable<number>;

  logs$: Observable<any[]>;
  tasks$: Observable<any[]>;

  constructor() {
    // Initialize with logs from TimeLogService
    this.logs$ = this.timeLogService.getLogs();
    
    // Get tasks from TaskService
    this.tasks$ = this.taskService.getTasks();
    
    // Set user with actual manager name from session
    const savedUser = this.getSavedUser();
    this.setUser(savedUser.name, savedUser.role);

    // Calculate initial team members count
    const initialCount = this.calculateTeamMembersCountSync();
    this.teamMembersSubject = new BehaviorSubject<number>(initialCount);
    this.teamMembers$ = this.teamMembersSubject.asObservable();

    // Load team members count - Subscribe to users so it updates whenever users change
    this.userService.getUsers().subscribe(users => {
      this.updateTeamMembersCount(users);
    });
  }

  /**
   * Calculate team members count synchronously from stored user data
   */
  private calculateTeamMembersCountSync(): number {
    const currentManagerId = this.getCurrentManagerId();
    
    // Try to get users from localStorage if available
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const storedUsers = localStorage.getItem('users');
        if (storedUsers) {
          const users = JSON.parse(storedUsers);
          const currentManager = users.find((u: any) => u.id === currentManagerId);
          // Return the count of assigned employees (not the count of logs)
          const assignedCount = currentManager?.assignedEmployees?.length || 0;
          return assignedCount;
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    return 0;
  }

  /**
   * Update team members count based on assigned employees
   */
  private updateTeamMembersCount(users: any[]): void {
    const currentManagerId = this.getCurrentManagerId();
    const currentManager = users.find(u => u.id === currentManagerId);
    
    // Get the count of assigned employees
    const assignedCount = currentManager?.assignedEmployees?.length || 0;
    this.teamMembersSubject.next(assignedCount);
  }

  /**
   * Get current manager ID from session
   */
  private getCurrentManagerId(): string {
    if (!isPlatformBrowser(this.platformId)) {
      return '';
    }

    const saved = localStorage.getItem('user_session');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        return user.id || '';
      } catch (e) {
        console.error('Error parsing user_session:', e);
        return '';
      }
    }
    return '';
  }

  // Generate current date string
  private getCurrentDate(): string {
    return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Generate date string for X days ago
  private getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Retrieve saved user from localStorage
  private getSavedUser() {
    if (!isPlatformBrowser(this.platformId)) {
      return { name: 'Loading...', role: '', id: '', initial: '' };
    }

    const saved = localStorage.getItem('user_session');
    if (saved) {
      const user = JSON.parse(saved);
      let fullName = user.fullName || 'Manager'; // fallback to Manager if fullName not available
      
      return {
        name: fullName,
        role: user.role,
        id: user.id,
        initial: fullName.charAt(0).toUpperCase()
      };
    }
    return { name: 'Loading...', role: '', id: '', initial: '' };
  }

  // Update current user session
  setUser(name: string, role: string) {
    this.currentUserSubject.next({
      name: name,
      role: role,
      initial: name.charAt(0).toUpperCase()
    });
  }

  // Clear user session on logout
  clearUser() {
    this.currentUserSubject.next({
      name: 'Loading...',
      role: '',
      initial: ''
    });
  }

  // Add new time log entry (delegates to TimeLogService which handles API)
  addLog(log: any) {
    this.timeLogService.addLog(log);
  }

  // Add new task (delegates to TaskService which handles API)
  addTask(task: any) {
    this.taskService.addTask(task);
  }

  // Update existing task (delegates to TaskService which handles API)
  updateTask(id: string, task: any) {
    this.taskService.updateTask(id, task);
  }

  // Remove task by ID (delegates to TaskService which handles API)
  deleteTask(id: string) {
    this.taskService.deleteTask(id);
  }

  // Refresh tasks to ensure latest data is displayed
  refreshTasks() {
    console.log('🔄 ManagerDataService.refreshTasks - Forcing task refresh');
    this.taskService.refreshTasks();
  }
}