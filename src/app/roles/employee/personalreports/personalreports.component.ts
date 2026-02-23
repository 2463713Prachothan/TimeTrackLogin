import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { TimeLogService } from '../../../core/services/time-log.service';
import { TaskService, Task } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';
import { ApiResponse } from '../../../core/models/time-log.model';

Chart.register(...registerables);

@Component({
  selector: 'app-personalreports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './personalreports.component.html',
  styleUrls: ['./personalreports.component.css']
})
export class PersonalreportsComponent implements OnInit, AfterViewInit { 
  @ViewChild('barChart') barChartCanvas!: ElementRef;
  @ViewChild('pieChart') pieChartCanvas!: ElementRef;

  private timeLogService = inject(TimeLogService);
  private taskService = inject(TaskService);
  private authService = inject(AuthService);

  // Stats data
  totalHoursLogged: number = 0;
  taskCompletionRate: number = 0;
  efficiencyScore: number = 0;
  completedTasks: number = 0;
  totalTasks: number = 0;
  inProgressTasks: number = 0;
  pendingTasks: number = 0;
  weeklyAverage: number = 0;

  // Chart data
  lastSevenDaysLabels: string[] = [];
  lastSevenDaysHours: number[] = [];
  taskStatusData = { completed: 0, inProgress: 0, pending: 0 };
  
  // Demo mode flag - set to true to show sample data
  isDemoMode: boolean = false;

  // Chart instances for destroying and recreating
  private barChartInstance: Chart | null = null;
  private pieChartInstance: Chart | null = null;

  ngOnInit() {
    this.loadProductivityData();
    // ALWAYS load time logs to ensure total hours is calculated
    this.loadTimeLogsForTotalHours();
  }

  ngAfterViewInit() {
    this.createBarChart();
    this.createPieChart();
  }

  /**
   * Convert decimal hours to "Xh Ym" format
   * Example: 1.5 hours = "1h 30m"
   */
  formatHours(hours: number): string {
    if (hours === 0) return '0m';
    
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    
    if (wholeHours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${wholeHours}h`;
    } else {
      return `${wholeHours}h ${minutes}m`;
    }
  }

  /**
   * Get formatted total hours for display
   */
  getFormattedTotalHours(): string {
    return this.formatHours(this.totalHoursLogged);
  }

  /**
   * Get formatted weekly average for display
   */
  getFormattedWeeklyAverage(): string {
    return this.formatHours(this.weeklyAverage);
  }

  /**
   * Load time logs to calculate total hours
   * This runs separately to ensure total hours is always populated
   */
  private loadTimeLogsForTotalHours() {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      console.warn('⚠️ No current user found, cannot load time logs');
      return;
    }

    console.log('📊 Loading time logs for total hours calculation');
    
    this.timeLogService.getLogs().subscribe({
      next: (logs: any[]) => {
        if (!logs || logs.length === 0) {
          console.log('📊 No time logs found');
          return;
        }

        // Filter logs for current employee
        const myLogs = logs.filter(log => 
          log.employee === currentUser.fullName || 
          log.employeeId === currentUser.id ||
          log.userId === currentUser.id
        );

        console.log('📊 Time logs for user:', myLogs.length);

        if (myLogs.length > 0) {
          // Calculate total hours from logs
          const totalFromLogs = myLogs.reduce((sum, log) => sum + (log.totalHours || 0), 0);
          console.log('📊 Total hours from logs:', totalFromLogs);
          
          // Only update if API didn't provide a value or provided 0
          if (this.totalHoursLogged === 0 || this.totalHoursLogged === undefined) {
            this.totalHoursLogged = totalFromLogs;
            console.log('✅ Updated totalHoursLogged from time logs:', this.totalHoursLogged);
          }
        }
      },
      error: (err) => {
        console.error('❌ Error loading time logs:', err);
      }
    });
  }

  /**
   * Load all productivity data from services
   */
  private loadProductivityData() {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      console.warn('No current user found');
      return;
    }

    console.log('📊 PersonalreportsComponent.loadProductivityData - Starting to load productivity data for:', currentUser.fullName);

    // First try to load from Productivity API
    console.log('📊 PersonalreportsComponent - Fetching productivity from API: /api/Productivity');
    this.taskService.getProductivity().subscribe({
      next: (productivityData: any) => {
        console.log('✅ PersonalreportsComponent - API productivity data loaded successfully:', productivityData);
        
        // Verify the response has actual data
        if (productivityData && Object.keys(productivityData).length > 0) {
          this.applyProductivityData(productivityData);
        } else {
          console.warn('⚠️ PersonalreportsComponent - API returned empty response, using fallback');
          this.loadProductivityDataFallback(currentUser);
        }
      },
      error: (err) => {
        console.warn('⚠️ PersonalreportsComponent - Productivity API failed, falling back to local calculation:', err);
        console.warn('Error details:', {
          status: err.status,
          message: err.message,
          statusText: err.statusText
        });
        // Fallback to previous calculation method
        this.loadProductivityDataFallback(currentUser);
      }
    });
  }

  /**
   * Apply productivity data from API
   */
  private applyProductivityData(data: any) {
    console.log('📊 PersonalreportsComponent.applyProductivityData - Raw API response:', data);
    
    this.totalHoursLogged = parseFloat(data.totalHoursLogged) || 0;
    this.taskCompletionRate = parseInt(data.taskCompletionRate) || 0;
    this.efficiencyScore = parseInt(data.efficiencyScore) || 0;
    this.completedTasks = parseInt(data.completedTasks) || 0;
    this.totalTasks = parseInt(data.totalTasks) || 0;
    this.inProgressTasks = parseInt(data.inProgressTasks) || 0;
    this.pendingTasks = parseInt(data.pendingTasks) || 0;
    this.weeklyAverage = parseFloat(data.weeklyAverage) || 0;

    console.log('📊 PersonalreportsComponent.applyProductivityData - Parsed values:', {
      totalHoursLogged: this.totalHoursLogged,
      taskCompletionRate: this.taskCompletionRate,
      efficiencyScore: this.efficiencyScore,
      completedTasks: this.completedTasks,
      totalTasks: this.totalTasks,
      inProgressTasks: this.inProgressTasks,
      pendingTasks: this.pendingTasks,
      weeklyAverage: this.weeklyAverage
    });

    // Parse chart data if available
    if (data.dailyHours && Array.isArray(data.dailyHours)) {
      this.lastSevenDaysHours = data.dailyHours.map((h: any) => parseFloat(h) || 0);
      console.log('📊 Daily hours data:', this.lastSevenDaysHours);
    }

    if (data.taskDistribution) {
      this.taskStatusData = {
        completed: parseInt(data.taskDistribution.completed) || 0,
        inProgress: parseInt(data.taskDistribution.inProgress) || 0,
        pending: parseInt(data.taskDistribution.pending) || 0
      };
      console.log('📊 Task distribution:', this.taskStatusData);
    }

    // Generate labels for the last 7 days
    const today = new Date();
    this.lastSevenDaysLabels = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      this.lastSevenDaysLabels.push(dateStr);
    }

    console.log('📊 Productivity data fully applied and ready for display');
  }

  /**
   * Load demo data for testing/preview purposes
   * REMOVED - only show real data now
   */
  private loadDemoData() {
    console.log('⏭️ Demo data loading skipped - showing real data only');
  }

  /**
   * Fallback: Load productivity data using local calculation
   */
  private loadProductivityDataFallback(currentUser: any) {
    console.log('⚠️ Using fallback method to load productivity data');
    
    // Load time logs
    this.timeLogService.getLogs().subscribe({
      next: (logs: any[]) => {
        // Filter logs for current employee
        const myLogs = logs.filter(log => 
          log.employee === currentUser.fullName || log.employeeId === currentUser.id
        );

        console.log('📝 Fallback - Time logs found:', myLogs.length);

        // Calculate total hours and weekly data
        this.calculateTimeMetrics(myLogs);
      },
      error: (err) => {
        console.error('❌ Error loading time logs:', err);
        // Show demo data if no real data available
        this.loadDemoData();
      }
    });

    // Load tasks
    this.taskService.getMyTasks().subscribe({
      next: (tasks: Task[]) => {
        console.log('📝 Fallback - Tasks found:', tasks.length);
        // Calculate task metrics
        this.calculateTaskMetrics(tasks);
      },
      error: (err) => {
        console.error('❌ Error loading tasks:', err);
        // Show demo data if no real data available
        if (this.totalHoursLogged === 0 && this.totalTasks === 0) {
          this.loadDemoData();
        }
      }
    });
  }

  /**
   * Calculate time-based metrics (hours logged, weekly average)
   */
  private calculateTimeMetrics(logs: any[]) {
    if (logs.length === 0) {
      console.warn('⚠️ No time logs found. Showing 0 values.');
      this.totalHoursLogged = 0;
      this.weeklyAverage = 0;
      // Don't show demo data - show real empty state
      return;
    }

    // Calculate total hours
    this.totalHoursLogged = logs.reduce((sum, log) => sum + (log.totalHours || 0), 0);

    // Get last 7 days data
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    this.lastSevenDaysLabels = [];
    this.lastSevenDaysHours = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      this.lastSevenDaysLabels.push(dateStr);

      // Sum hours for this day
      const dayLogs = logs.filter(log => {
        const logDate = new Date(log.date);
        return logDate.toDateString() === date.toDateString();
      });

      const dayHours = dayLogs.reduce((sum, log) => sum + (log.totalHours || 0), 0);
      this.lastSevenDaysHours.push(parseFloat(dayHours.toFixed(1)));
    }

    // Calculate weekly average
    const daysWithLogs = new Set(logs.map(log => new Date(log.date).toDateString())).size;
    this.weeklyAverage = daysWithLogs > 0 ? parseFloat((this.totalHoursLogged / daysWithLogs).toFixed(1)) : 0;

    console.log('Time Metrics:', { totalHours: this.totalHoursLogged, weeklyAverage: this.weeklyAverage });

    // Refresh charts if there's data
    if (this.lastSevenDaysHours.length > 0) {
      this.refreshCharts();
    }
  }

  /**
   * Calculate task-based metrics (completion rate, efficiency)
   */
  private calculateTaskMetrics(tasks: Task[]) {
    if (tasks.length === 0) {
      console.warn('⚠️ No tasks found. Showing 0 values.');
      this.taskCompletionRate = 0;
      this.efficiencyScore = 0;
      this.totalTasks = 0;
      this.taskStatusData = { completed: 0, inProgress: 0, pending: 0 };
      // Don't show demo data - show real empty state
      return;
    }

    this.totalTasks = tasks.length;

    // Count tasks by status
    this.completedTasks = tasks.filter(t => t.status === 'Completed').length;
    this.inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
    this.pendingTasks = tasks.filter(t => t.status === 'Pending').length;

    // Calculate completion rate
    this.taskCompletionRate = this.totalTasks > 0 
      ? Math.round((this.completedTasks / this.totalTasks) * 100)
      : 0;

    // Calculate efficiency score (completed + in-progress / total)
    const activeAndCompleted = this.completedTasks + this.inProgressTasks;
    this.efficiencyScore = this.totalTasks > 0 
      ? Math.round((activeAndCompleted / this.totalTasks) * 100)
      : 0;

    // Update task status data for pie chart
    this.taskStatusData = {
      completed: this.completedTasks,
      inProgress: this.inProgressTasks,
      pending: this.pendingTasks
    };

    console.log('Task Metrics:', { 
      completionRate: this.taskCompletionRate, 
      efficiencyScore: this.efficiencyScore,
      taskStatus: this.taskStatusData
    });

    // Refresh charts with new data
    if (this.totalTasks > 0) {
      this.refreshCharts();
    }
  }

  /**
   * Refresh charts after data is loaded
   */
  private refreshCharts() {
    console.log('🔄 Refreshing charts with new data');
    
    // Destroy existing charts if they exist
    if (this.barChartInstance) {
      this.barChartInstance.destroy();
      this.barChartInstance = null;
    }
    if (this.pieChartInstance) {
      this.pieChartInstance.destroy();
      this.pieChartInstance = null;
    }

    // Wait for DOM to update, then create new charts
    setTimeout(() => {
      this.createBarChart();
      this.createPieChart();
    }, 100);
  }

  /**
   * Create bar chart for daily hours logged
   */
  createBarChart() {
    if (!this.barChartCanvas) {
      console.warn('⚠️ Bar chart canvas not found');
      return;
    }

    console.log('📊 Creating bar chart with data:', this.lastSevenDaysHours);

    this.barChartInstance = new Chart(this.barChartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: this.lastSevenDaysLabels,
        datasets: [{
          label: 'Hours Logged',
          data: this.lastSevenDaysHours,
          backgroundColor: '#8cc63f',
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false,
        indexAxis: 'x',
        scales: {
          y: {
            beginAtZero: true,
            max: Math.max(8, Math.max(...this.lastSevenDaysHours) + 1)
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const hours = context.parsed.y;
                return this.formatHours(hours);
              }
            }
          }
        }
      }
    });
  }

  /**
   * Create pie chart for task status distribution
   */
  createPieChart() {
    if (!this.pieChartCanvas) {
      console.warn('⚠️ Pie chart canvas not found');
      return;
    }

    console.log('📊 Creating pie chart with data:', this.taskStatusData);

    this.pieChartInstance = new Chart(this.pieChartCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'In Progress', 'Pending'],
        datasets: [{
          data: [
            this.taskStatusData.completed,
            this.taskStatusData.inProgress,
            this.taskStatusData.pending
          ],
          backgroundColor: ['#10b981', '#3b82f6', '#64748b'],
          borderColor: ['#ffffff', '#ffffff', '#ffffff'],
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
  }
}