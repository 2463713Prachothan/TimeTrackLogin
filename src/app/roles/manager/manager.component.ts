import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TeamLogsComponent } from './team-logs/team-logs.component';
import { TaskManagementComponent } from './task-management/task-management.component';
import { TeamAnalyticsComponent } from './team-analytics/team-analytics.component';
import { ManagerDataService } from '../../core/services/manager-data.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-manager',
  standalone: true,
  imports: [CommonModule, TeamLogsComponent, TaskManagementComponent, TeamAnalyticsComponent],
  templateUrl: './manager.component.html',
  styleUrls: ['./manager.component.css']
})
export class ManagerComponent implements OnInit {

  isDropdownOpen = false;
  user: any = { name: '', role: '', initial: '' };
  tab: string = 'logs';

  // Dashboard metrics
  totalMembers: number = 0;
  activeTasks: number = 0;
  totalHoursToday: number = 0;
  completionRate: number = 0;

  constructor(
    private router: Router,
    private dataService: ManagerDataService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    // Subscribe to user data for navbar
    this.dataService.currentUser$.subscribe(userData => {
      this.user = userData;
    });

    // Calculate active tasks and completion rate
    this.dataService.tasks$.subscribe(tasks => {
      this.activeTasks = tasks.filter(t => t.status !== 'Completed').length;
      const completedTasks = tasks.filter(t => t.status === 'Completed').length;
      this.completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
    });

    // Get total team members count
    this.dataService.performance$.subscribe(members => {
      this.totalMembers = members.length;
    });

    // Calculate today's total hours from logs
    this.dataService.logs$.subscribe(logs => {
      const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const todayLogs = logs.filter(log => log.date === today);
      this.totalHoursToday = todayLogs.reduce((sum, log) => sum + log.totalHours, 0);
    });
  }

  // Toggle user profile dropdown
  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  // Close dropdown when clicking outside
  @HostListener('document:click')
  closeDropdown() {
    this.isDropdownOpen = false;
  }

  // Handle user logout
  onLogout() {
    this.dataService.clearUser();
    this.authService.logout();
    this.router.navigate(['/signin']);
  }
}