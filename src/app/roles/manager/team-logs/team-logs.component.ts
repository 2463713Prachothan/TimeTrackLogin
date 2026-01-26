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
  readonly MOCK_TODAY = 'Jan 12';
  readonly MOCK_WEEK = ['Jan 10', 'Jan 11', 'Jan 12']; 

  allLogs: TimeLog[] = [];
  uniqueMembers: string[] = [];
  filteredLogs: TimeLog[] = [];
  
  selectedMember: string = 'All Team Members';
  selectedTimeFrame: string = 'Today';

  constructor(private dataService: ManagerDataService) {}

  ngOnInit() {
    this.dataService.logs$.subscribe((data: any[]) => {
      this.allLogs = data;
      this.uniqueMembers = [...new Set(this.allLogs.map((log: any) => log.employee))];
      this.updateDashboard();
    });
  }

  updateDashboard() {
    let temp = [...this.allLogs];

    if (this.selectedMember !== 'All Team Members') {
      temp = temp.filter(log => log.employee === this.selectedMember);
    }

    if (this.selectedTimeFrame === 'Today') {
      this.filteredLogs = temp.filter(log => log.date === this.MOCK_TODAY);
    } else if (this.selectedTimeFrame === 'This Week') {
      this.filteredLogs = temp.filter(log => this.MOCK_WEEK.includes(log.date));
    } else if (this.selectedTimeFrame === 'All Time') {
      this.filteredLogs = temp;
    } else {
      this.filteredLogs = []; 
    }
  }

  // This is the getter that was "missing"
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

  getMemberStats(name: string) {
    const memberLogs = this.allLogs.filter(l => l.employee === name);
    let timeframeLogs: TimeLog[] = [];

    if (this.selectedTimeFrame === 'Today') {
      timeframeLogs = memberLogs.filter(l => l.date === this.MOCK_TODAY);
    } else if (this.selectedTimeFrame === 'This Week') {
      timeframeLogs = memberLogs.filter(l => this.MOCK_WEEK.includes(l.date));
    } else if (this.selectedTimeFrame === 'All Time') {
      timeframeLogs = memberLogs;
    }

    return {
      hours: timeframeLogs.reduce((s, l) => s + l.totalHours, 0).toFixed(1),
      days: new Set(timeframeLogs.map(l => l.date)).size
    };
  }
} 