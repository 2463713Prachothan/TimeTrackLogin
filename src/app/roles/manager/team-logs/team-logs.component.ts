import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimeLogService } from '../../../core/services/time-log.service';
import { UserService } from '../../../core/services/user.service';
import { TeamTimeLog, TeamMember } from '../../../core/models/time-log.model';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface TimeLogDisplay extends TeamTimeLog {
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
  private timeLogService = inject(TimeLogService);
  private userService = inject(UserService);
  private destroy$ = new Subject<void>();

  readonly today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  readonly currentWeekDates = this.getCurrentWeekDates();

  allLogs: TeamTimeLog[] = [];
  uniqueMembers: string[] = [];
  filteredLogs: TeamTimeLog[] = [];
  teamMembers: TeamMember[] = [];

  // Filter variables
  selectedMember: string = 'All Team Members';
  selectedMemberId: string = 'All';
  selectedTimeFrame: string = 'Today';
  selectedPeriod: string = 'Today';

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
    this.fetchTeamLogs();
    this.fetchTeamMembers();

    // Start real-time refresh every second
    this.startRealtimeRefresh();
  }

  /**
   * Fetch team members from UserService
   */
  private fetchTeamMembers(): void {
    const managerId = this.getCurrentManagerId();
    if (!managerId) {
      this.teamMembers = [];
      return;
    }

    this.userService.getTeamMembers(managerId.toString())
      .pipe(takeUntil(this.destroy$))
      .subscribe(users => {
        // Map users to TeamMember with calculated hours
        this.teamMembers = users.map(user => {
          const employeeLogs = this.allLogs.filter(log =>
            log.employeeName?.toLowerCase() === user.fullName?.toLowerCase()
          );
          const totalHours = employeeLogs.reduce((sum, log) => sum + (log.totalHours || 0), 0);

          return {
            id: user.id || '',
            name: user.fullName,
            email: user.email,
            totalHours: totalHours,
            department: user.department,
            status: user.status
          };
        });
      });
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

  private fetchTeamLogs(): void {
    const managerId = this.getCurrentManagerId();
    if (!managerId) {
      this.allLogs = [];
      this.filteredLogs = [];
      return;
    }

    this.timeLogService.getTeamTimeLogs(managerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((logs: TeamTimeLog[]) => {
        this.allLogs = logs || [];
        this.uniqueMembers = Array.from(new Set(this.allLogs.map(l => l.employeeName)));
        this.updateDashboard();
        this.updateTeamMemberHours();
      });
  }

  /**
   * Update team member hours based on current logs
   */
  private updateTeamMemberHours(): void {
    this.teamMembers = this.teamMembers.map(member => {
      const employeeLogs = this.allLogs.filter(log =>
        log.employeeName?.toLowerCase() === member.name?.toLowerCase()
      );
      const totalHours = employeeLogs.reduce((sum, log) => sum + (log.totalHours || 0), 0);
      return { ...member, totalHours };
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
  private getCurrentManagerId(): number | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('user_session');
      if (saved) {
        const user = JSON.parse(saved);
        const parsed = Number(user.userId ?? user.id);
        return Number.isNaN(parsed) ? null : parsed;
      }
    }
    return null;
  }

  private formatLogDate(dateValue: string): string {
    const d = new Date(dateValue);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  /**
   * Filter logs based on selected criteria
   * Called when dropdown values change
   */
  filterLogs() {
    // Sync alias variables
    this.selectedPeriod = this.selectedTimeFrame;
    this.selectedMemberId = this.selectedMember === 'All Team Members' ? 'All' : this.selectedMember;
    
    let temp = [...this.allLogs];

    // Filter by member
    if (this.selectedMember !== 'All Team Members') {
      temp = temp.filter(log => log.employeeName === this.selectedMember);
    }

    // Filter by timeframe
    if (this.selectedTimeFrame === 'Today') {
      this.filteredLogs = temp.filter(log => this.formatLogDate(log.date) === this.today);
    } else if (this.selectedTimeFrame === 'This Week') {
      this.filteredLogs = temp.filter(log => this.currentWeekDates.includes(this.formatLogDate(log.date)));
    } else if (this.selectedTimeFrame === 'All Time') {
      this.filteredLogs = temp;
    } else {
      this.filteredLogs = [];
    }
  }

  // Alias for backward compatibility
  updateDashboard() {
    this.filterLogs();
  }

  /**
   * Get filtered team members based on selected member dropdown
   */
  get displayedMembers(): TeamMember[] {
    if (this.selectedMember === 'All Team Members') {
      return this.teamMembers;
    }
    return this.teamMembers.filter(m => m.name === this.selectedMember);
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

  formatBreakMinutes(value: string | undefined): string {
    if (!value) {
      return '0';
    }

    const parts = value.split(':').map(Number);
    if (parts.length < 2 || parts.some(part => Number.isNaN(part))) {
      return '0';
    }

    const hours = parts[0] || 0;
    const minutes = parts[1] || 0;
    const totalMinutes = hours * 60 + minutes;
    return totalMinutes.toString();
  }

  // Calculate summary statistics for filtered logs
  get summaryStats() {
    const data = this.filteredLogs;
    if (data.length === 0) return { total: '0.0', avg: '0.0', entries: 0 };

    const totalHours = data.reduce((sum, log) => sum + (log.totalHours || 0), 0);
    const uniqueDays = new Set(data.map(l => this.formatLogDate(l.date))).size;

    return {
      total: totalHours.toFixed(1),
      avg: (totalHours / (uniqueDays || 1)).toFixed(1),
      entries: data.length
    };
  }

  // Get individual member statistics
  getMemberStats(name: string) {
    const memberLogs = this.allLogs.filter(l => l.employeeName === name);
    let timeframeLogs: TeamTimeLog[] = [];

    if (this.selectedTimeFrame === 'Today') {
      timeframeLogs = memberLogs.filter(l => this.formatLogDate(l.date) === this.today);
    } else if (this.selectedTimeFrame === 'This Week') {
      timeframeLogs = memberLogs.filter(l => this.currentWeekDates.includes(this.formatLogDate(l.date)));
    } else if (this.selectedTimeFrame === 'All Time') {
      timeframeLogs = memberLogs;
    }

    return {
      hours: timeframeLogs.reduce((s, l) => s + l.totalHours, 0).toFixed(1),
      days: new Set(timeframeLogs.map(l => this.formatLogDate(l.date))).size
    };
  }
} 