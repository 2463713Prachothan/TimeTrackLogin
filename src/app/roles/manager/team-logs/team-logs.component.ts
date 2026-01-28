import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManagerDataService } from '../../../core/services/manager-data.service'; 

interface TimeLog {
  employee: string;
  date: string;
  startTime: string;
  endTime: string;
  break: number;
  totalHours: number;
}

@Component({
  selector: 'app-team-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team-logs.component.html',
  styleUrls: ['./team-logs.component.css']
})
export class TeamLogsComponent implements OnInit {
  readonly today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  readonly currentWeekDates = this.getCurrentWeekDates();

  allLogs: TimeLog[] = [];
  uniqueMembers: string[] = [];
  filteredLogs: TimeLog[] = [];

  selectedMember: string = 'All Team Members';
  selectedTimeFrame: string = 'Today';

  constructor(private dataService: ManagerDataService) {}

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
    // Load and process time logs
    this.dataService.logs$.subscribe((data: any[]) => {
      this.allLogs = data;
      this.uniqueMembers = [...new Set(this.allLogs.map((log: any) => log.employee))];
      this.updateDashboard();
    });
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

  // Calculate summary statistics for filtered logs
  get summaryStats() {
    const data = this.filteredLogs;
    if (data.length === 0) return { total: '0.0', avg: '0.0', entries: 0 };

    const totalHours = data.reduce((sum, log) => sum + log.totalHours, 0);
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