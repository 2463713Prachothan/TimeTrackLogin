import { Component, OnInit } from '@angular/core';
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
  tab: string = 'logs';
  
  // These variables will hold the live numbers
  totalMembers: number = 0;
  activeTasks: number = 0;

  constructor(
    private router: Router,
    private dataService: ManagerDataService // Inject the service
  ) {}

  ngOnInit() {
    // 1. Get Live Task Count
    this.dataService.tasks$.subscribe(tasks => {
      // Counts tasks that are NOT completed
      this.activeTasks = tasks.filter(t => t.status !== 'Completed').length;
    });

    // 2. Get Live Member Count
    this.dataService.logs$.subscribe(logs => {
      // Finds unique names in the log list
      const names = new Set(logs.map(l => l.employee));
      this.totalMembers = names.size;
    });
  }

  onLogout() {
    this.router.navigate(['/']);
  }
}