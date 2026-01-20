import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TeamLogsComponent } from './team-logs/team-logs.component';
import { TaskManagementComponent } from './task-management/task-management.component';
import { TeamAnalyticsComponent } from './team-analytics/team-analytics.component';
import { ManagerDataService } from '../../core/services/manager-data.service'; // Ensure this path is correct

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
    private router: Router,
    private dataService: ManagerDataService // Inject the service
  ) {}

  ngOnInit() {

    // Dynamically get the logged-in user's name and role
    this.dataService.currentUser$.subscribe(userData => {
      console.log('User detected in Navbar:', userData);
      this.user = userData;
    });
    // 1. Get Live Task Count
    this.dataService.tasks$.subscribe(tasks => {
      // Counts tasks that are NOT completed
      this.activeTasks = tasks.filter(t => t.status !== 'Completed').length;
    });

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
    this.router.navigate(['']);
  }
}