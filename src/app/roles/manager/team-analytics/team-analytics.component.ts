import { Component, OnInit, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { ManagerDataService } from '../../../core/services/manager-data.service';
import { Subject, takeUntil } from 'rxjs';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-team-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team-analytics.component.html',
  styleUrls: ['./team-analytics.component.css']
})
export class TeamAnalyticsComponent implements OnInit, AfterViewInit, OnDestroy {
  private dataService = inject(ManagerDataService);
  private destroy$ = new Subject<void>();
  
  private trendChart: any;
  private memberChart: any;
  private chartsInitialized = false;

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

  constructor() {}

  ngOnInit() {
    // Subscribe to logs for real-time team performance updates
    this.dataService.logs$.pipe(takeUntil(this.destroy$)).subscribe(logs => {
      console.log('📊 Team Analytics - Logs updated:', logs.length);
      this.calculateTeamPerformance(logs);
      this.calculateSummary(logs);
      this.updateCharts(logs);
    });

    // Subscribe to tasks for completion metrics
    this.dataService.tasks$.pipe(takeUntil(this.destroy$)).subscribe(tasks => {
      console.log('📊 Team Analytics - Tasks updated:', tasks.length);
      this.summary.totalTasks = tasks.length;
      this.summary.completedTasks = tasks.filter(t => t.status === 'Completed').length;
      this.summary.completionRate = tasks.length > 0
        ? Math.round((this.summary.completedTasks / tasks.length) * 100)
        : 0;
    });
  }

  // Calculate summary statistics from logs
  calculateSummary(logs: any[]) {
    if (!logs || logs.length === 0) {
      this.summary.totalHours = 0;
      this.summary.avgHours = 0;
      return;
    }

    const total = logs.reduce((sum, log) => sum + log.totalHours, 0);
    this.summary.totalHours = Number(total.toFixed(1));
    const members = new Set(logs.map(l => l.employee)).size;
    this.summary.avgHours = members > 0 ? Number((total / members).toFixed(1)) : 0;
  }

  calculateTeamPerformance(logs: any[]) {
    // Group logs by employee
    const employeeData: { [key: string]: any } = {};

    logs.forEach(log => {
      if (!employeeData[log.employee]) {
        employeeData[log.employee] = {
          name: log.employee,
          hours: 0,
          tasks: 0,
          efficiency: 0,
          status: 'Good'
        };
      }
      employeeData[log.employee].hours += log.totalHours;
    });

    // Calculate efficiency for each employee
    Object.values(employeeData).forEach((emp: any) => {
      // Efficiency based on hours logged (assume 8 hours per day is 100%)
      const daysWorked = Math.ceil(emp.hours / 8);
      emp.efficiency = Math.min(Math.round((emp.hours / (daysWorked * 8)) * 100), 100);
      
      // Set status based on efficiency
      if (emp.efficiency >= 90) {
        emp.status = 'Excellent';
      } else if (emp.efficiency >= 70) {
        emp.status = 'Good';
      } else {
        emp.status = 'Needs Attention';
      }
    });

    this.teamPerformance = Object.values(employeeData);
  }

  ngAfterViewInit() {
    // Delay to ensure DOM is ready
    setTimeout(() => {
      this.initCharts();
    }, 100);
  }

  private updateCharts(logs: any[]) {
    if (!this.chartsInitialized || !logs || logs.length === 0) {
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

      // Initialize trend chart - will be populated with real data
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
              ticks: { stepSize: 10 }
            }
          }
        }
      });

      // Initialize member chart - will be populated with real data
      this.memberChart = new Chart("memberChart", {
        type: 'bar',
        data: {
          labels: [],
          datasets: [{
            label: 'Hours Logged',
            data: [],
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

      this.chartsInitialized = true;
      console.log('📊 Charts initialized - waiting for data');

    } catch (error) {
      console.error('Chart initialization error:', error);
    }
  }

  // Update member hours chart with real data
  updateMemberChart(logs: any[]) {
    if (!this.memberChart || !this.chartsInitialized) return;

    try {
      const memberData: { [key: string]: number } = {};
      logs.forEach(log => {
        memberData[log.employee] = (memberData[log.employee] || 0) + log.totalHours;
      });

      const sortedMembers = Object.keys(memberData).sort();
      this.memberChart.data.labels = sortedMembers;
      this.memberChart.data.datasets[0].data = sortedMembers.map(m => memberData[m]);
      this.memberChart.update();
      console.log('📊 Member chart updated with real data');
    } catch (error) {
      console.error('Member chart update error:', error);
    }
  }

  // Update trend chart with real data
  updateTrendChart(logs: any[]) {
    if (!this.trendChart || !this.chartsInitialized) return;

    try {
      const dateData: { [key: string]: number } = {};
      logs.forEach(log => {
        dateData[log.date] = (dateData[log.date] || 0) + log.totalHours;
      });

      const sortedDates = Object.keys(dateData).sort();
      this.trendChart.data.labels = sortedDates;
      this.trendChart.data.datasets[0].data = sortedDates.map(d => dateData[d]);
      this.trendChart.update();
      console.log('📊 Trend chart updated with real data');
    } catch (error) {
      console.error('Trend chart update error:', error);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.trendChart) {
      this.trendChart.destroy();
    }
    if (this.memberChart) {
      this.memberChart.destroy();
    }
  }
}