import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { TimeLogService } from '../../../core/services/time-log.service';
import { TaskService, Task } from '../../../core/services/task.service';
import { AuthService } from '../../../core/services/auth.service';

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

  ngOnInit() {
    this.loadProductivityData();
  }

  ngAfterViewInit() {
    this.createBarChart();
    this.createPieChart();
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

    // Load time logs
    this.timeLogService.getLogs().subscribe((logs: any[]) => {
      // Filter logs for current employee
      const myLogs = logs.filter(log => 
        log.employee === currentUser.fullName || log.employeeId === currentUser.id
      );

      // Calculate total hours and weekly data
      this.calculateTimeMetrics(myLogs);
    });

    // Load tasks
    this.taskService.getTasks().subscribe((tasks: Task[]) => {
      // Filter tasks assigned to current employee
      const myTasks = tasks.filter(task => 
        task.assignedTo.toLowerCase() === currentUser.fullName.toLowerCase()
      );

      // Calculate task metrics
      this.calculateTaskMetrics(myTasks);
    });
  }

  /**
   * Calculate time-based metrics (hours logged, weekly average)
   */
  private calculateTimeMetrics(logs: any[]) {
    if (logs.length === 0) {
      this.totalHoursLogged = 0;
      this.weeklyAverage = 0;
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
  }

  /**
   * Calculate task-based metrics (completion rate, efficiency)
   */
  private calculateTaskMetrics(tasks: Task[]) {
    if (tasks.length === 0) {
      this.taskCompletionRate = 0;
      this.efficiencyScore = 0;
      this.totalTasks = 0;
      this.taskStatusData = { completed: 0, inProgress: 0, pending: 0 };
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
  }

  /**
   * Create bar chart for daily hours logged
   */
  createBarChart() {
    if (!this.barChartCanvas) return;

    new Chart(this.barChartCanvas.nativeElement, {
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
            max: 8
          }
        }
      }
    });
  }

  /**
   * Create pie chart for task status distribution
   */
  createPieChart() {
    if (!this.pieChartCanvas) return;

    new Chart(this.pieChartCanvas.nativeElement, {
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