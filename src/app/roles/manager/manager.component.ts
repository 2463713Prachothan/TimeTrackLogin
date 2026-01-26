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

  // These variables will hold the live numbers
  totalMembers: number = 0;
  activeTasks: number = 0;

  constructor(
    private router: Router, // Inject the router
    private dataService: ManagerDataService, // Inject the service
    private authService: AuthService // Add this injection
  ) { }

  ngOnInit() {

    // Current user info for the navbar/profile
    this.dataService.currentUser$.subscribe(userData => {
      console.log('User detected in Navbar:', userData);
      this.user = userData;
    });
    // Active tasks count
    this.dataService.tasks$.subscribe(tasks => {
      this.activeTasks = tasks.filter(t => t.status !== 'Completed').length;
    });

    // Count Total members
    this.dataService.logs$.subscribe(logs => {
      const names = new Set(logs.map(l => l.employee));
      this.totalMembers = names.size;
    });

    // Replace your logs$ subscription for totalMembers with this:
    this.dataService.performance$.subscribe(members => {
      this.totalMembers = members.length;
    });
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  @HostListener('document:click')
  closeDropdown() {
    this.isDropdownOpen = false;
  }

  onLogout() {
    // Clear the navbar data in ManagerDataService
    this.dataService.clearUser();

    // Clear the session in AuthService
    this.authService.logout();

    // Navigate back to sign-in
    this.router.navigate(['/signin']);
  }
}