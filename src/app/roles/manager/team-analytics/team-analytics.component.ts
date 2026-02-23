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
  private completionChart: any;
  private chartsInitialized = false;

  // Performance table data
  teamPerformance: any[] = [];

  // Summary metrics for dashboard cards
  summary = {
    totalHours: 0,
    avgHours: 0,
    completionRate: 0,
    completedTasks: 0,
    totalTasks: 0,
    teamMembers: 0
  };

  constructor() {}

  ngOnInit() {
    console.log('📊 TeamAnalyticsComponent - Initializing');
    
    // Subscribe to team analytics data with auto-refresh
    this.dataService.logs$.pipe(takeUntil(this.destroy$)).subscribe(logs => {
      console.log('📊 Team Analytics - Logs updated:', logs.length);
      if (logs.length > 0) {
        this.updateMemberChart(logs);
        this.updateTrendChart(logs);
        this.teamPerformance = this.dataService.getTeamPerformanceByMember(logs);
      }
    });

    // Subscribe to tasks for completion metrics
    this.dataService.tasks$.pipe(takeUntil(this.destroy$)).subscribe(tasks => {
      console.log('📊 Team Analytics - Tasks updated:', tasks.length);
      if (tasks.length > 0) {
        this.summary.totalTasks = tasks.length;
        this.summary.completedTasks = tasks.filter(t => t.status === 'Completed').length;
        this.summary.completionRate = tasks.length > 0
          ? Math.round((this.summary.completedTasks / tasks.length) * 100)
          : 0;
        this.updateCompletionChart(tasks);
      }
    });

    // Subscribe to summary data
    this.dataService.getTeamAnalytics().pipe(takeUntil(this.destroy$)).subscribe(analytics => {
      if (analytics && analytics.summary) {
        this.summary = analytics.summary;
        console.log('📊 Summary updated:', this.summary);
      }
    });
  }

  ngAfterViewInit() {
    // Delay to ensure DOM is ready
    setTimeout(() => {
      this.initCharts();
    }, 100);
  }

  private initCharts() {
    try {
      const trendCanvas = document.getElementById('trendChart');
      const memberCanvas = document.getElementById('memberChart');
      const completionCanvas = document.getElementById('completionChart');

      if (!trendCanvas || !memberCanvas || !completionCanvas) {
        console.warn('⚠️ Chart canvases not found');
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

      // Initialize completion chart - task completion by status
      this.completionChart = new Chart("completionChart", {
        type: 'doughnut',
        data: {
          labels: ['Completed', 'In Progress', 'Pending'],
          datasets: [{
            data: [0, 0, 0],
            backgroundColor: ['#10b981', '#3b82f6', '#e5e7eb'],
            borderColor: '#ffffff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
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
  private updateMemberChart(logs: any[]) {
    if (!this.memberChart || !this.chartsInitialized) return;

    try {
      const memberData: { [key: string]: number } = {};
      logs.forEach(log => {
        const employeeName = log.employee || log.employeeName || 'Unknown';
        memberData[employeeName] = (memberData[employeeName] || 0) + (log.totalHours || 0);
      });

      const sortedMembers = Object.keys(memberData).sort();
      this.memberChart.data.labels = sortedMembers;
      this.memberChart.data.datasets[0].data = sortedMembers.map(m => parseFloat(memberData[m].toFixed(2)));
      this.memberChart.update();
      console.log('📊 Member chart updated with real data');
    } catch (error) {
      console.error('Member chart update error:', error);
    }
  }

  // Update trend chart with real data
  private updateTrendChart(logs: any[]) {
    if (!this.trendChart || !this.chartsInitialized) return;

    try {
      const dateData: { [key: string]: number } = {};
      logs.forEach(log => {
        const date = log.date || new Date().toLocaleDateString();
        dateData[date] = (dateData[date] || 0) + (log.totalHours || 0);
      });

      const sortedDates = Object.keys(dateData).sort();
      this.trendChart.data.labels = sortedDates;
      this.trendChart.data.datasets[0].data = sortedDates.map(d => parseFloat(dateData[d].toFixed(2)));
      this.trendChart.update();
      console.log('📊 Trend chart updated with real data');
    } catch (error) {
      console.error('Trend chart update error:', error);
    }
  }

  // Update task completion chart
  private updateCompletionChart(tasks: any[]) {
    if (!this.completionChart || !this.chartsInitialized) return;

    try {
      const completed = tasks.filter(t => t.status === 'Completed').length;
      const inProgress = tasks.filter(t => t.status === 'In Progress').length;
      const pending = tasks.filter(t => t.status === 'Pending').length;

      this.completionChart.data.datasets[0].data = [completed, inProgress, pending];
      this.completionChart.update();
      console.log('📊 Completion chart updated:', { completed, inProgress, pending });
    } catch (error) {
      console.error('Completion chart update error:', error);
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
    if (this.completionChart) {
      this.completionChart.destroy();
    }
  }
}