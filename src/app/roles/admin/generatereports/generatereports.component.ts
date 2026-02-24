import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart as ChartType } from 'chart.js';
import { ApiService } from '../../../core/services/api.service';
import { TaskService } from '../../../core/services/task.service';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

declare var Chart: any;

// ==================== DATA MODELS ====================

interface OrganizationAnalyticsResponse {
  statusCode: number;
  message: string;
  data: {
    totalHoursLogged: number;
    avgHoursPerEmployee: number;
    activeEmployees: number;
    totalEmployees: number;
    completedTasks: number;
    inProgressTasks: number;
    pendingTasks: number;
    taskCompletionPercentage: number;
    employeeCount: number;
    managerCount: number;
    adminCount: number;
    departmentMetrics: DepartmentAnalyticsDto[];
    avgEmployeesPerDepartment: number;
    hoursTrendData: DailyHoursDto[];
    reportGeneratedAt: string;
    periodRange: string;
  };
  timestamp: string;
}

interface DepartmentAnalyticsDto {
  departmentName: string;
  employeeCount: number;
  totalHours: number;
  avgHoursPerEmployee: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  employeeIds: string[];
}

interface DailyHoursDto {
  date: string;
  totalHours: number;
  activeEmployees: number;
  dateLabel: string;
}

@Component({
  selector: 'app-generatereports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './generatereports.component.html',
  styleUrls: ['./generatereports.component.css']
})
export class GeneratereportsComponent implements OnInit, AfterViewInit, OnDestroy {
  private apiService = inject(ApiService);
  private taskService = inject(TaskService);
  private destroy$ = new Subject<void>();

  availablePeriods = [
    { label: '7 Days', value: 7 },
    { label: '14 Days', value: 14 },
    { label: '30 Days', value: 30 },
    { label: '90 Days', value: 90 }
  ];
  selectedPeriod = 7;
  departments: string[] = [];
  selectedDepartment = 'All';

  summary = {
    totalHours: 0,
    avgHoursPerEmployee: 0,
    taskCompletionPct: 0,
    activeEmployees: 0,
    avgEmployeesPerDept: 0
  };

  taskCompletion = {
    completed: 0,
    inProgress: 0,
    pending: 0,
    completionRate: 0
  };

  roleDistribution = { employees: 0, managers: 0, admins: 0 };
  hoursTrendData: number[] = [];

  departmentRows: any[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  @ViewChild('hoursTrendCanvas') hoursTrendCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('roleDistributionCanvas') roleDistributionCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('hoursByDeptCanvas') hoursByDeptCanvas?: ElementRef<HTMLCanvasElement>;

  hoursTrendChart: any = null;
  roleChart: any = null;
  hoursByDeptChart: any = null;

  constructor() {
    this.loadChartJS();
  }

  private loadChartJS() {
    if (!window.hasOwnProperty('Chart')) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }

  ngOnInit(): void {
    console.log('🔄 GenerateReportsComponent initialized - Loading organization analytics');
    this.loadOrganizationAnalytics();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.createCharts(), 100);
    window.addEventListener('resize', () => this.onWindowResize());
  }

  ngOnDestroy(): void {
    this.destroyCharts();
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('resize', () => this.onWindowResize());
  }

  /**
   * Load organization analytics from backend API
   * Fetches both organization summary AND dedicated task completion breakdown
   */
  private loadOrganizationAnalytics(): void {
    this.isLoading = true;
    this.errorMessage = null;

    console.log('📡 Fetching organization analytics with period:', this.selectedPeriod);

    // Calculate date range based on selected period
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - this.selectedPeriod);

    // Format dates for API (ISO string format)
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log('📅 Date range:', { startDate: startDateStr, endDate: endDateStr });

    forkJoin({
      organizationData: this.apiService.getOrganizationAnalytics(this.selectedPeriod as 7 | 14 | 30 | 90),
      taskCompletion: this.apiService.getTaskCompletionBreakdown(startDateStr, endDateStr)
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results: any) => {
          this.processAnalyticsData(results.organizationData, results.taskCompletion);
        },
        error: (err: any) => {
          console.error('❌ Error loading analytics:', err);
          this.errorMessage = 'Failed to load analytics data';
          this.isLoading = false;
        }
      });
  }

  /**
   * Process analytics data from both organization and task endpoints
   */
  private processAnalyticsData(organizationResponse: OrganizationAnalyticsResponse, taskCompletionResponse: any): void {
    console.log('✅ Organization analytics received:', organizationResponse.data);
    console.log('✅ Task completion breakdown received:', taskCompletionResponse.data);

    // Ensure we have data
    if (!organizationResponse.data) {
      console.warn('⚠️ No organization data in response');
      this.isLoading = false;
      return;
    }

    const analyticsData = organizationResponse.data;

    // Update summary metrics
    this.summary.totalHours = analyticsData.totalHoursLogged || 0;
    this.summary.avgHoursPerEmployee = analyticsData.avgHoursPerEmployee || 0;
    this.summary.activeEmployees = analyticsData.activeEmployees || 0;
    this.summary.avgEmployeesPerDept = analyticsData.avgEmployeesPerDepartment || 0;

    // Update task completion metrics - PREFER dedicated endpoint data if available
    if (taskCompletionResponse && taskCompletionResponse.data) {
      this.taskCompletion.completed = taskCompletionResponse.data.completedCount || 0;
      this.taskCompletion.inProgress = taskCompletionResponse.data.inProgressCount || 0;
      this.taskCompletion.pending = taskCompletionResponse.data.pendingCount || 0;
      this.taskCompletion.completionRate = taskCompletionResponse.data.completionPercentage || 0;
      
      console.log('✅ Using task completion breakdown from dedicated endpoint');
    } else {
      // Fallback to organization summary if dedicated endpoint fails
      this.taskCompletion.completed = analyticsData.completedTasks || 0;
      this.taskCompletion.inProgress = analyticsData.inProgressTasks || 0;
      this.taskCompletion.pending = analyticsData.pendingTasks || 0;
      this.taskCompletion.completionRate = analyticsData.taskCompletionPercentage || 0;
      
      console.log('⚠️ Using task data from organization summary (fallback)');
    }

    console.log('📊 Task Completion Metrics:', {
      completed: this.taskCompletion.completed,
      inProgress: this.taskCompletion.inProgress,
      pending: this.taskCompletion.pending,
      completionRate: this.taskCompletion.completionRate,
      total: (this.taskCompletion.completed + this.taskCompletion.inProgress + this.taskCompletion.pending)
    });

    // Update role distribution
    this.roleDistribution.employees = analyticsData.employeeCount || 0;
    this.roleDistribution.managers = analyticsData.managerCount || 0;
    this.roleDistribution.admins = analyticsData.adminCount || 0;

    // Extract hours trend data from API response
    if (analyticsData.hoursTrendData && analyticsData.hoursTrendData.length > 0) {
      this.hoursTrendData = analyticsData.hoursTrendData.map(d => d.totalHours);
    } else {
      this.hoursTrendData = [];
    }

    // Extract departments and build rows
    if (analyticsData.departmentMetrics && analyticsData.departmentMetrics.length > 0) {
      // Filter out 'IT' department (admin department) from the list
      this.departments = analyticsData.departmentMetrics
        .filter(d => d.departmentName && d.departmentName.toLowerCase() !== 'it')
        .map(d => d.departmentName)
        .sort();
      
      this.departmentRows = analyticsData.departmentMetrics
        .filter(d => d.departmentName && d.departmentName.toLowerCase() !== 'it')
        .map(dept => ({
          department: dept.departmentName,
          employees: dept.employeeCount,
          totalHours: dept.totalHours,
          completedTasks: dept.completedTasks,
          avgHoursPerEmployee: dept.avgHoursPerEmployee
        }));
    } else {
      this.departments = [];
      this.departmentRows = [];
    }

    console.log('✅ Summary updated:', this.summary);
    console.log('✅ Department rows:', this.departmentRows);

    // Update charts after data is loaded
    setTimeout(() => {
      this.updateCharts();
    }, 100);

    this.isLoading = false;
  }

  /**
   * Load all departments from the application
   * (Previously extracted from timelogs - now using summary endpoint)
   */
  private loadDepartments(): void {
    // Departments are now loaded from organization-summary endpoint
    // This method is kept for reference but not called anymore
    console.log('📡 Loading departments...');
  }

  /**
   * Load analytics data for the organization
   * (Consolidated into loadOrganizationAnalytics)
   */
  private loadAnalyticsData(): void {
    // Analytics data is now loaded from organization-summary endpoint
    // This method is kept for reference but not called anymore
    console.log('📡 Loading analytics data...');
  }

  /**
   * Update department rows with real data
   */
  private updateDepartmentRows(): void {
    this.departmentRows = this.departments.map(dept => ({
      department: dept,
      employees: 0,
      totalHours: 0,
      completedTasks: 0,
      avgHoursPerEmployee: 0
    }));
  }

  private onWindowResize() {
    this.updateCharts();
  }

  /**
   * Format hours decimal to HH:MM format
   * Example: 1.5 -> "1h 5m", 2.833 -> "2h 50m"
   */
  formatHours(hours: number): string {
    if (!hours || hours === 0) return '0h 0m';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  }

  /**
   * Refresh analytics data with current filters
   */
  refreshData() {
    console.log('🔄 Refreshing analytics data...');
    this.loadOrganizationAnalytics();
  }

  /**
   * Reset filters and reload data
   */
  resetFilters() {
    console.log('🔄 Resetting filters...');
    this.selectedPeriod = 7;
    this.selectedDepartment = 'All';
    this.loadOrganizationAnalytics();
  }

  /**
   * Handle period change
   */
  onPeriodChange() {
    console.log('📊 Period changed to:', this.selectedPeriod);
    this.loadOrganizationAnalytics();
  }

  /**
   * Handle department filter change
   * Note: Department filtering happens on frontend (client-side filtering)
   */
  onDepartmentChange() {
    console.log('🏢 Department filtered to:', this.selectedDepartment);
    this.updateCharts();
  }

  exportReport() {
    const headers = ['Department', 'Employees', 'Total Hours', 'Completed Tasks', 'Avg Hours/Employee'];
    const rows = this.departmentRows.map(r => [
      r.department,
      String(r.employees),
      String(r.totalHours),
      String(r.completedTasks),
      String(r.avgHoursPerEmployee)
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'organization-analytics-' + new Date().toISOString().split('T')[0] + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  private createCharts() {
    if (typeof Chart === 'undefined') {
      setTimeout(() => this.createCharts(), 100);
      return;
    }
    this.createHoursTrendChart();
    this.createRoleDistributionChart();
    this.createHoursByDeptChart();
  }

  private updateCharts() {
    if (this.hoursTrendChart) {
      this.hoursTrendChart.data.labels = this.getDateLabels(this.selectedPeriod);
      this.hoursTrendChart.data.datasets[0].data = this.getHourSeriesForPeriod(this.selectedPeriod);
      this.hoursTrendChart.update();
    }
    if (this.roleChart) {
      this.roleChart.data.datasets[0].data = [this.roleDistribution.employees, this.roleDistribution.managers, this.roleDistribution.admins];
      this.roleChart.update();
    }
    if (this.hoursByDeptChart) {
      this.hoursByDeptChart.data.labels = this.departmentRows.map(r => r.department);
      this.hoursByDeptChart.data.datasets[0].data = this.departmentRows.map(r => r.totalHours);
      this.hoursByDeptChart.update();
    }
  }

  private destroyCharts() {
    [this.hoursTrendChart, this.roleChart, this.hoursByDeptChart].forEach(chart => {
      if (chart) chart.destroy();
    });
    this.hoursTrendChart = this.roleChart = this.hoursByDeptChart = null;
  }

  private createHoursTrendChart() {
    const canvas = this.hoursTrendCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.hoursTrendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.getDateLabels(this.selectedPeriod),
        datasets: [
          {
            label: 'Hours Logged',
            data: this.getHourSeriesForPeriod(this.selectedPeriod),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: '#6366f1',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverRadius: 7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 12 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: '#eef2e9', drawBorder: false },
            ticks: { font: { size: 12 } }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(31, 41, 55, 0.8)',
            padding: 12,
            cornerRadius: 8,
            titleFont: { size: 13 },
            bodyFont: { size: 12 },
            callbacks: {
              label: (context: any) => {
                const hours = context.parsed.y;
                return `Hours: ${this.formatHours(hours)}`;
              }
            }
          }
        }
      }
    });
  }

  private createRoleDistributionChart() {
    const canvas = this.roleDistributionCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.roleChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Employees', 'Managers', 'Admins'],
        datasets: [
          {
            data: [this.roleDistribution.employees, this.roleDistribution.managers, this.roleDistribution.admins],
            backgroundColor: ['#60a5fa', '#8cc63f', '#a78bfa'],
            borderColor: '#fff',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { padding: 15, font: { size: 12 }, generateLabels: (chart: any) => {
              const data = chart.data;
              return (data.labels || []).map((label: string, i: number) => ({
                text: `${label}: ${data.datasets[0].data[i]}`,
                fillStyle: (data.datasets[0].backgroundColor as string[])[i],
                hidden: false,
                index: i
              }));
            }}
          },
          tooltip: { backgroundColor: 'rgba(31, 41, 55, 0.8)', padding: 12, cornerRadius: 8 }
        }
      }
    });
  }

  private createHoursByDeptChart() {
    const canvas = this.hoursByDeptCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.hoursByDeptChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.departmentRows.map(r => r.department),
        datasets: [
          {
            label: 'Total Hours',
            data: this.departmentRows.map(r => r.totalHours),
            backgroundColor: ['#6366f1', '#8cc63f', '#f59e0b'],
            borderRadius: 8,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 12 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: '#eef2e9', drawBorder: false },
            ticks: { font: { size: 12 } }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(31, 41, 55, 0.8)',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context: any) => {
                const hours = context.parsed.y;
                return `Total Hours: ${this.formatHours(hours)}`;
              }
            }
          }
        }
      }
    });
  }



  private getDateLabels(days: number): string[] {
    const labels: string[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      labels.push(d.toLocaleString('en-US', { month: 'short', day: 'numeric' }));
    }
    return labels;
  }

  private getHourSeriesForPeriod(days: number): number[] {
    // Return real data from API instead of dummy data
    // If hoursTrendData is available and matches the period, use it
    if (this.hoursTrendData && this.hoursTrendData.length === days) {
      return this.hoursTrendData;
    }
    // Fallback to empty array if no data available
    return Array(days).fill(0);
  }
}