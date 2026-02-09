import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { TimeLogService, TimeLog } from '../../../core/services/time-log.service';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface TimeLogDisplay extends TimeLog {
  displayHours?: string; // Formatted display hours
  elapsedTime?: string; // Time elapsed since start
}

@Component({
  selector: 'app-team-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team-logs.component.html',
  styleUrls: ['./team-logs.component.css']
})
export class TeamLogsComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private timeLogService = inject(TimeLogService);
  private destroy$ = new Subject<void>();

  readonly today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  readonly currentWeekDates = this.getCurrentWeekDates();

  allLogs: TimeLog[] = [];
  uniqueMembers: string[] = [];
  filteredLogs: TimeLog[] = [];
  assignedEmployeeNames: Set<string> = new Set();

  selectedMember: string = 'All Team Members';
  selectedTimeFrame: string = 'Today';

  // Generate current week date strings
  private getCurrentWeekDates(): string[] {
    const dates: string[] = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return dates;
  }

  ngOnInit() {
    // Get current manager info from session
    const currentManagerId = this.getCurrentManagerId();

    // Step 1: Load assigned employees list and setup filter
    this.userService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe((users: any[]) => {
        // Get the current manager's record
        const currentManager = users.find(u => u.id === currentManagerId);

        // Get employees assigned to this manager
        let assignedEmployeeIds: string[] = [];
        if (currentManager && currentManager.assignedEmployees) {
          assignedEmployeeIds = currentManager.assignedEmployees;
        }

        // Get assigned employee names and populate dropdown
        const assignedEmployees = users.filter(u => assignedEmployeeIds.includes(u.id));
        this.assignedEmployeeNames = new Set(assignedEmployees.map(emp => emp.fullName));
        this.uniqueMembers = assignedEmployees.map(emp => emp.fullName);

        // NOW subscribe to logs AFTER we have the employee names
        this.subscribeToLogs();
      });

    // Start real-time refresh every second
    this.startRealtimeRefresh();
  }

  /**
   * Start real-time refresh of logs for live hour calculation
   */
  private startRealtimeRefresh(): void {
    interval(1000) // Update every second for smooth real-time display
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateDashboard(); // Recalculate display every second
      });
  }

  /**
   * Subscribe to time logs and filter by assigned employees
   * This is called AFTER assignedEmployeeNames is populated
   */
  private subscribeToLogs(): void {
    this.timeLogService.getLogs()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any[]) => {
        // Filter logs to show only assigned employees
        const filteredByEmployee = data.filter((log: any) => 
          this.assignedEmployeeNames.has(log.employee)
        );
        
        this.allLogs = filteredByEmployee;
        
        // Update dashboard with new filtered logs
        this.updateDashboard();
      });
  }

  ngOnDestroy() {
    // Unsubscribe from all subscriptions when component is destroyed
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

  // Filter logs based on selected criteria
  updateDashboard() {
    let temp = [...this.allLogs];

    // Filter by member
    if (this.selectedMember !== 'All Team Members') {
      temp = temp.filter(log => log.employee === this.selectedMember);
    }

    // Filter by timeframe
    if (this.selectedTimeFrame === 'Today') {
      this.filteredLogs = temp.filter(log => log.date === this.today);
    } else if (this.selectedTimeFrame === 'This Week') {
      this.filteredLogs = temp.filter(log => this.currentWeekDates.includes(log.date));
    } else if (this.selectedTimeFrame === 'All Time') {
      this.filteredLogs = temp;
    } else {
      this.filteredLogs = [];
    }
  }

  /**
   * Calculate elapsed time since start time
   */
  getElapsedTime(startTime: string): string {
    const now = new Date();
    const [startHour, startMin] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(startHour, startMin, 0);

    const elapsedMs = now.getTime() - startDate.getTime();
    const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60));
    const elapsedMins = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
    const elapsedSecs = Math.floor((elapsedMs % (1000 * 60)) / 1000);

    return `${elapsedHours}h ${elapsedMins}m ${elapsedSecs}s`;
  }

  /**
   * Format hours to 2 decimal places
   */
  formatHours(hours: number | undefined): string {
    return hours ? hours.toFixed(2) : '0.00';
  }

  // Calculate summary statistics for filtered logs
  get summaryStats() {
    const data = this.filteredLogs;
    if (data.length === 0) return { total: '0.0', avg: '0.0', entries: 0 };

    const totalHours = data.reduce((sum, log) => sum + (log.currentHours || log.totalHours || 0), 0);
    const uniqueDays = new Set(data.map(l => l.date)).size;

    return {
      total: totalHours.toFixed(1),
      avg: (totalHours / (uniqueDays || 1)).toFixed(1),
      entries: data.length
    };
  }

  // Get individual member statistics
  getMemberStats(name: string) {
    const memberLogs = this.allLogs.filter(l => l.employee === name);
    let timeframeLogs: TimeLog[] = [];

    if (this.selectedTimeFrame === 'Today') {
      timeframeLogs = memberLogs.filter(l => l.date === this.today);
    } else if (this.selectedTimeFrame === 'This Week') {
      timeframeLogs = memberLogs.filter(l => this.currentWeekDates.includes(l.date));
    } else if (this.selectedTimeFrame === 'All Time') {
      timeframeLogs = memberLogs;
    }

    return {
      hours: timeframeLogs.reduce((s, l) => s + l.totalHours, 0).toFixed(1),
      days: new Set(timeframeLogs.map(l => l.date)).size
    };
  }
} 