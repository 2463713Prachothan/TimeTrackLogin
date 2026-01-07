import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core'; // Import Input
import { FormsModule } from '@angular/forms';

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
export class LogHoursComponent {
  showModal = false;

  // Initial Data based on LLD
  logs: TimeLog[] = [
    { date: 'Sun, Dec 15', startTime: '09:00', endTime: '17:30', breakMin: 60, totalHours: '7.50' },
    { date: 'Sat, Dec 14', startTime: '09:00', endTime: '18:00', breakMin: 60, totalHours: '8.00' },
    { date: 'Fri, Dec 13', startTime: '09:15', endTime: '17:45', breakMin: 45, totalHours: '7.75' }
  ];

  // Form Model for Two-Way Binding
  newLog = { date: '', startTime: '', endTime: '', breakMin: 0 };

  toggleModal() {
    this.showModal = !this.showModal;
  }

  addLog() {
    if (!this.newLog.date || !this.newLog.startTime || !this.newLog.endTime) return;

    const total = this.calculateHours(this.newLog.startTime, this.newLog.endTime, this.newLog.breakMin);

    const entry: TimeLog = {
      date: new Date(this.newLog.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      startTime: this.newLog.startTime,
      endTime: this.newLog.endTime,
      breakMin: this.newLog.breakMin,
      totalHours: total.toFixed(2)
    };

    this.logs.unshift(entry); // Add to top of list
    this.toggleModal();
    this.resetForm();
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