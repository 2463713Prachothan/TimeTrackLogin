import { CommonModule } from '@angular/common';
import { Component, Input, inject, OnInit } from '@angular/core'; // Import Input
import { FormsModule } from '@angular/forms';
import { TimeLogService, TimeLog as ServiceTimeLog } from '../../../core/services/time-log.service';
import { NotificationService } from '../../../core/services/notification.service';


interface TimeLog {
  date: string;
  startTime: string;
  endTime: string;
  breakMin: number;
  totalHours: string;
}


@Component({
  selector: 'app-log-hours',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './loghours.component.html',
  styleUrl: './loghours.component.css',
})
export class LogHoursComponent implements OnInit {
  // Inject services
  private timeLogService = inject(TimeLogService);
  private notificationService = inject(NotificationService);

  showModal = false;
  logs: TimeLog[] = [];

  ngOnInit() {
    this.loadTimeLogs();
  }

  /**
   * Load time logs from the TimeLogService
   */
  private loadTimeLogs() {
    this.timeLogService.getLogs().subscribe(
      (serviceLogs: ServiceTimeLog[]) => {
        // Transform service data to component format
        this.logs = serviceLogs.map(log => ({
          date: log.date,
          startTime: log.startTime,
          endTime: log.endTime,
          breakMin: log.break,
          totalHours: log.totalHours.toFixed(2)
        }));
      },
      (error) => {
        console.error('Error loading time logs:', error);
        this.notificationService.error('Failed to load time logs');
      }
    );
  }

  // Form Model for Two-Way Binding
  newLog = { date: '', startTime: '', endTime: '', breakMin: 0 };

  toggleModal() {
    this.showModal = !this.showModal;
  }

  addLog() {
    if (!this.newLog.date || !this.newLog.startTime || !this.newLog.endTime) {
      this.notificationService.warning('Please fill in all required fields');
      return;
    }

    const total = this.calculateHours(this.newLog.startTime, this.newLog.endTime, this.newLog.breakMin);

    const newTimeLog: ServiceTimeLog = {
      employee: 'Current Employee', // You can get this from Auth Service
      date: new Date(this.newLog.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      startTime: this.newLog.startTime,
      endTime: this.newLog.endTime,
      break: this.newLog.breakMin,
      totalHours: total,
      status: 'Pending'
    };

    // Add log using the service
    this.timeLogService.addLog(newTimeLog);
    this.notificationService.success('Time log added successfully');

    this.toggleModal();
    this.resetForm();
    this.loadTimeLogs(); // Reload the logs
  }

  private calculateHours(start: string, end: string, pause: number): number {
    const s = start.split(':');
    const e = end.split(':');
    const startDate = new Date(0, 0, 0, parseInt(s[0]), parseInt(s[1]));
    const endDate = new Date(0, 0, 0, parseInt(e[0]), parseInt(e[1]));
    let diff = endDate.getTime() - startDate.getTime();
    let hours = diff / 1000 / 60 / 60;
    return Math.max(0, hours - (pause / 60)); // Ensure non-negative
  }

  private resetForm() {
    this.newLog = { date: '', startTime: '', endTime: '', breakMin: 0 };
  }

}