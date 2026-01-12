import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';
import { ManagerDataService } from '../../../core/services/manager-data.service';

@Component({
  selector: 'app-team-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team-analytics.component.html',
  styleUrls: ['./team-analytics.component.css']
})
export class TeamAnalyticsComponent implements OnInit, AfterViewInit {
  private trendChart: any;
  private memberChart: any;
  
  // Data for the Performance Table
  teamPerformance: any[] = [];
  
  // Data for the Top Summary Cards
  summary = { 
    totalHours: 0, 
    avgHours: 0, 
    completionRate: 0, 
    completedTasks: 0, 
    totalTasks: 0 
  };

  constructor(private dataService: ManagerDataService) {}

  ngOnInit() {
    // 1. Subscribe to Performance Data (Fills the list of John, Emily, David, Sarah)
    this.dataService.performance$.subscribe(data => {
      this.teamPerformance = data;
    });

    // 2. Subscribe to Logs (Updates 62 total hours and the Charts)
    this.dataService.logs$.subscribe(logs => {
      this.calculateSummary(logs);
      
      // Use setTimeout to ensure Chart objects are initialized before updating
      setTimeout(() => {
        if (this.memberChart) this.updateMemberChart(logs);
        if (this.trendChart) this.updateTrendChart(logs);
      }, 100);
    });

    // 3. Subscribe to Tasks (Updates Completion Rate 25% and 1/4 Tasks)
    this.dataService.tasks$.subscribe(tasks => {
      this.summary.totalTasks = tasks.length;
      this.summary.completedTasks = tasks.filter(t => t.status === 'Completed').length;
      this.summary.completionRate = tasks.length > 0 
        ? Math.round((this.summary.completedTasks / tasks.length) * 100) 
        : 0;
    });
  }

  calculateSummary(logs: any[]) {
    const total = logs.reduce((sum, log) => sum + log.totalHours, 0);
    this.summary.totalHours = Number(total.toFixed(1));
    const members = new Set(logs.map(l => l.employee)).size;
    this.summary.avgHours = members > 0 ? Number((total / members).toFixed(1)) : 0;
  }

  ngAfterViewInit() {
    this.initCharts();
  }

  initCharts() {
    // Initialize Trend Chart (Hours per Day)
    this.trendChart = new Chart("trendChart", {
      type: 'line',
      data: { 
        labels: [], 
        datasets: [{ 
          label: 'Total Hours', 
          data: [], 
          borderColor: '#8cc63f', 
          backgroundColor: 'rgba(208, 241, 99, 0.1)',
          fill: true,
          tension: 0.4 
        }] 
      },
      options: { 
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { 
          y: { 
            beginAtZero: true,
            ticks: { stepSize: 10 } // Scales properly for your 62 hours
          } 
        } 
      }
    });

    // Initialize Member Chart (Hours per Person)
    this.memberChart = new Chart("memberChart", {
      type: 'bar',
      data: { 
        labels: [], 
        datasets: [{ 
          label: 'Hours Logged', 
          data: [], 
          backgroundColor: '#8cc63f', // Matches your theme
          borderRadius: 6 
        }] 
      },
      options: { 
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { 
          y: { 
            beginAtZero: true // Scales up for John's 35.5 hrs
          } 
        } 
      }
    });
  }

  updateMemberChart(logs: any[]) {
    const memberData: { [key: string]: number } = {};
    logs.forEach(log => {
      memberData[log.employee] = (memberData[log.employee] || 0) + log.totalHours;
    });

    this.memberChart.data.labels = Object.keys(memberData);
    this.memberChart.data.datasets[0].data = Object.values(memberData);
    this.memberChart.update();
  }

  updateTrendChart(logs: any[]) {
    const dateData: { [key: string]: number } = {};
    logs.forEach(log => {
      dateData[log.date] = (dateData[log.date] || 0) + log.totalHours;
    });

    const sortedDates = Object.keys(dateData).sort();
    this.trendChart.data.labels = sortedDates;
    this.trendChart.data.datasets[0].data = sortedDates.map(d => dateData[d]);
    this.trendChart.update();
  }
}