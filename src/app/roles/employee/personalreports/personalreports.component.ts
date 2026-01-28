import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { TimeLogService } from '../../../core/services/time-log.service';
import { TaskService } from '../../../core/services/task.service';
import { NotificationService } from '../../../core/services/notification.service';

Chart.register(...registerables);

@Component({
  selector: 'app-personalreports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './personalreports.component.html',
  styleUrls: ['./personalreports.component.css']
})
export class PersonalreportsComponent implements AfterViewInit {
  constructor(
    private timeLogService: TimeLogService,
    private taskService: TaskService,
    private notificationService: NotificationService
  ) { }
  @ViewChild('barChart') barChartCanvas!: ElementRef;
  @ViewChild('pieChart') pieChartCanvas!: ElementRef;

  ngAfterViewInit() {
    this.createBarChart();
    this.createPieChart();
  }

  createBarChart() {
    new Chart(this.barChartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Dec 13', 'Dec 14', 'Dec 15'],
        datasets: [{
          label: 'Hours Logged',
          data: [7.8, 8.2, 7.5],
          backgroundColor: '#8cc63f', // Deep purple from your design
          borderRadius: 8
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  createPieChart() {
    new Chart(this.pieChartCanvas.nativeElement, {
      type: 'pie',
      data: {
        labels: ['Completed', 'In Progress', 'Pending'],
        datasets: [{
          data: [33, 33, 33],
          backgroundColor: ['#10b981', '#3b82f6', '#64748b'] // Match your status colors
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }
} // Note the capitalized 'P'