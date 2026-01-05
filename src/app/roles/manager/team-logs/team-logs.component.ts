import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  readonly MOCK_TODAY = 'Dec 15'; //

  // This is your "Database". Any name added here automatically updates the UI
  allLogs: TimeLog[] = [
    { employee: 'John Smith', date: 'Dec 15', startTime: '09:00', endTime: '17:30', break: 60, totalHours: 7.50 },
    { employee: 'Emily Davis', date: 'Dec 15', startTime: '08:30', endTime: '17:00', break: 60, totalHours: 7.50 },
    { employee: 'David Wilson', date: 'Dec 15', startTime: '09:00', endTime: '18:30', break: 60, totalHours: 8.50 },
    { employee: 'John Smith', date: 'Dec 14', startTime: '09:00', endTime: '18:00', break: 60, totalHours: 8.00 },
    { employee: 'John Smith', date: 'Dec 13', startTime: '09:15', endTime: '17:45', break: 45, totalHours: 7.75 }
  ];

  // Dynamically generated lists
  uniqueMembers: string[] = [];
  filteredLogs: TimeLog[] = [];
  
  selectedMember: string = 'All Team Members';
  selectedTimeFrame: string = 'Today'; // Default view

  ngOnInit() {
    // Automatically extract unique names from the data
    this.uniqueMembers = [...new Set(this.allLogs.map(log => log.employee))];
    this.updateDashboard();
  }

  // Dynamic Filtering Logic
  updateDashboard() {
    let temp = [...this.allLogs];

    // 1. Filter by Member
    if (this.selectedMember !== 'All Team Members') {
      temp = temp.filter(log => log.employee === this.selectedMember);
    }

    // 2. Filter by Time Frame
    if (this.selectedTimeFrame === 'Today') {
      this.filteredLogs = temp.filter(log => log.date === this.MOCK_TODAY);
    } else if (this.selectedTimeFrame === 'All Time') {
      this.filteredLogs = temp;
    } else {
      // "This Week" is empty as per current design
      this.filteredLogs = [];
    }
  }

  // Dynamic Top Summary Stats
  get summaryStats() {
    const data = this.filteredLogs;
    if (data.length === 0) return { total: '0.0', avg: '0.0', entries: 0 };

    const totalHours = data.reduce((sum, log) => sum + log.totalHours, 0);
    const uniqueDays = new Set(data.map(l => l.date)).size;

    return {
      total: totalHours.toFixed(1),
      avg: (totalHours / uniqueDays).toFixed(1),
      entries: data.length
    };
  }

  // Dynamic Individual Card Stats
  getMemberStats(name: string) {
    const memberLogs = this.allLogs.filter(l => l.employee === name);
    let timeframeLogs: TimeLog[] = [];

    if (this.selectedTimeFrame === 'Today') {
      timeframeLogs = memberLogs.filter(l => l.date === this.MOCK_TODAY);
    } else if (this.selectedTimeFrame === 'All Time') {
      timeframeLogs = memberLogs;
    }

    return {
      hours: timeframeLogs.reduce((s, l) => s + l.totalHours, 0).toFixed(1),
      days: new Set(timeframeLogs.map(l => l.date)).size
    };
  }
}