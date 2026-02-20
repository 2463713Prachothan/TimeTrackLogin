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
  elapsedTime?: string;  // Time elapsed since start
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
  
teamMembersCount = 0;
  teamHoursToday = 0;
  teamLogs: any[] = [];
  stats: any = null;


  // Filters
  selectedMember: string = 'All Team Members';
  selectedMemberId: string = 'All';
  selectedTimeFrame: string = 'Today';
  selectedPeriod: string = 'Today';

ngOnInit(): void {
    const managerId = this.getCurrentManagerId(); // <-- string
    if (!managerId) {
      console.warn('No managerId in session');
      return;
    }

this.timeLogService.getManagerStats(managerId).subscribe(stats => {
      this.stats = stats;
    });

    this.timeLogService.getTeamMembersCount(managerId).subscribe(teamCount => {
      this.teamMembersCount = teamCount;
    });

    this.timeLogService.getTeamTimeLogs(managerId).subscribe(logs => {
      this.teamLogs = logs || [];
    });
  }


  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---------------- Helpers ----------------

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

  /** Get current manager ID as GUID string */
  
 private getCurrentManagerId(): string | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const saved = localStorage.getItem('user_session');
    if (!saved) return null;
    try {
      const user = JSON.parse(saved);
      const id = user.userId ?? user.id; // whichever your session stores
      if (!id) return null;
      return typeof id === 'string' ? id : String(id);
    } catch {
      return null;
    }
  }


  // ---------------- Data fetchers ----------------

  /** Fetch team logs for the current manager */
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

  /** Fetch team members based on managerId via UserService */
  private fetchTeamMembers(): void {
    const managerId = this.getCurrentManagerId();
    if (!managerId) {
      this.teamMembers = [];
      return;
    }

    this.userService.getTeamMembers(managerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(users => {
        // Prefer matching logs by employeeId if your TeamTimeLog has it, else fallback to name
        this.teamMembers = users.map(user => {
          const employeeLogs = this.allLogs.filter(log =>
            (log as any).employeeId && user.id
              ? (log as any).employeeId === user.id
              : (log.employeeName?.toLowerCase() === user.fullName?.toLowerCase())
          );
          const totalHours = employeeLogs.reduce((sum, log) => sum + (log.totalHours || 0), 0);

          return {
            id: user.id || '',
            name: user.fullName,
            email: user.email,
            totalHours,
            department: user.department,
            status: user.status
          };
        });
      });
  }

  /** Update team member total hours from current logs */
  private updateTeamMemberHours(): void {
    this.teamMembers = this.teamMembers.map(member => {
      const employeeLogs = this.allLogs.filter(log =>
        (log as any).employeeId && member.id
          ? (log as any).employeeId === member.id
          : (log.employeeName?.toLowerCase() === member.name?.toLowerCase())
      );
      const totalHours = employeeLogs.reduce((sum, log) => sum + (log.totalHours || 0), 0);
      return { ...member, totalHours };
    });
  }

  // ---------------- Realtime refresh ----------------

  private startRealtimeRefresh(): void {
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateDashboard();
      });
  }

  // ---------------- Filters & UI helpers ----------------

  private formatLogDate(dateValue: string): string {
    const d = new Date(dateValue);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  filterLogs() {
    this.selectedPeriod = this.selectedTimeFrame;
    this.selectedMemberId = this.selectedMember === 'All Team Members' ? 'All' : this.selectedMember;

    let temp = [...this.allLogs];

    if (this.selectedMember !== 'All Team Members') {
      temp = temp.filter(log => log.employeeName === this.selectedMember);
    }

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

  /** Alias used elsewhere */
  updateDashboard() {
    this.filterLogs();
  }

  get displayedMembers(): TeamMember[] {
    if (this.selectedMember === 'All Team Members') {
      return this.teamMembers;
    }
    return this.teamMembers.filter(m => m.name === this.selectedMember);
  }

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

  formatHours(hours: number | undefined): string {
    return hours ? hours.toFixed(2) : '0.00';
  }

  formatBreakMinutes(value: string | undefined): string {
    if (!value) return '0';
    const parts = value.split(':').map(Number);
    if (parts.length < 2 || parts.some(Number.isNaN)) return '0';
    const [hours, minutes] = parts;
    return String((hours || 0) * 60 + (minutes || 0));
  }

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
      hours: timeframeLogs.reduce((s, l) => s + (l.totalHours || 0), 0).toFixed(1),
      days: new Set(timeframeLogs.map(l => this.formatLogDate(l.date))).size
    };
  }
}