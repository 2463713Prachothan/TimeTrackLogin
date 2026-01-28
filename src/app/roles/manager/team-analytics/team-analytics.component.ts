import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { ManagerDataService } from '../../../core/services/manager-data.service';

// Register Chart.js components
Chart.register(...registerables);

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
  private pendingLogsData: any[] = [];

  // Performance table data
  teamPerformance: any[] = [];

  // Summary metrics for dashboard cards
  summary = {
    totalHours: 0,
    avgHours: 0,
    completionRate: 0,
    completedTasks: 0,
    totalTasks: 0
  };

  constructor(private dataService: ManagerDataService) {}

  ngOnInit() {
    // Load team performance data
    this.dataService.performance$.subscribe(data => {
      this.teamPerformance = data;
    });

    // Process logs for charts and summary
    this.dataService.logs$.subscribe(logs => {
      this.calculateSummary(logs);
      this.updateCharts(logs);
    });

    // Calculate task completion metrics
    this.dataService.tasks$.subscribe(tasks => {
      this.summary.totalTasks = tasks.length;
      this.summary.completedTasks = tasks.filter(t => t.status === 'Completed').length;
      this.summary.completionRate = tasks.length > 0
        ? Math.round((this.summary.completedTasks / tasks.length) * 100)
        : 0;
    });
  }

  // Calculate summary statistics from logs
  calculateSummary(logs: any[]) {
    const total = logs.reduce((sum, log) => sum + log.totalHours, 0);
    this.summary.totalHours = Number(total.toFixed(1));
    const members = new Set(logs.map(l => l.employee)).size;
    this.summary.avgHours = members > 0 ? Number((total / members).toFixed(1)) : 0;
  }

  ngAfterViewInit() {
    // Delay to ensure DOM is ready
    setTimeout(() => {
      this.initCharts();
      // Update with pending data if available
      if (this.pendingLogsData.length > 0) {
        this.updateCharts(this.pendingLogsData);
        this.pendingLogsData = [];
      }
    }, 100);
  }

  private updateCharts(logs: any[]) {
    if (!this.memberChart || !this.trendChart) {
      this.pendingLogsData = logs;
      return;
    }
    this.updateMemberChart(logs);
    this.updateTrendChart(logs);
  }

  private initCharts() {
    try {
      const trendCanvas = document.getElementById('trendChart');
      const memberCanvas = document.getElementById('memberChart');

      if (!trendCanvas || !memberCanvas) {
        return;
      }

      // Initialize trend chart with sample data
      this.trendChart = new Chart("trendChart", {
        type: 'line',
        data: {
          labels: ['Jan 25', 'Jan 26', 'Jan 27'],
          datasets: [{
            label: 'Total Hours',
            data: [15.5, 22.0, 30.5],
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
              ticks: { stepSize: 10 }
            }
          }
        }
      });

      // Initialize member chart with sample data
      this.memberChart = new Chart("memberChart", {
        type: 'bar',
        data: {
          labels: ['Akash', 'Chandana', 'Prachothan', 'Gopi', 'Umesh'],
          datasets: [{
            label: 'Hours Logged',
            data: [15.5, 14.0, 13.5, 8.0, 11.7],
            backgroundColor: '#8cc63f',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });

    } catch (error) {
      console.error('Chart initialization error:', error);
    }
  }

  // Update member hours chart with real data
  updateMemberChart(logs: any[]) {
    if (!this.memberChart) return;

    try {
      const memberData: { [key: string]: number } = {};
      logs.forEach(log => {
        memberData[log.employee] = (memberData[log.employee] || 0) + log.totalHours;
      });

      this.memberChart.data.labels = Object.keys(memberData);
      this.memberChart.data.datasets[0].data = Object.values(memberData);
      this.memberChart.update();
    } catch (error) {
      console.error('Member chart update error:', error);
    }
  }

  // Update trend chart with real data
  updateTrendChart(logs: any[]) {
    if (!this.trendChart) return;

    try {
      const dateData: { [key: string]: number } = {};
      logs.forEach(log => {
        dateData[log.date] = (dateData[log.date] || 0) + log.totalHours;
      });

      const sortedDates = Object.keys(dateData).sort();
      this.trendChart.data.labels = sortedDates;
      this.trendChart.data.datasets[0].data = sortedDates.map(d => dateData[d]);
      this.trendChart.update();
    } catch (error) {
      console.error('Trend chart update error:', error);
    }
  }
}