import { Component, Input } from '@angular/core'; // Import Input
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-log-hours',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './loghours.component.html',
  styleUrls: ['./loghours.component.css']
})
export class LogHoursComponent {
  // Fixes NG8002: Now these properties are "known" to Angular
  @Input() logs: any[] = [];
  @Input() weeklyHours: string | number = 0;

  showModal: boolean = false;

  // Form object for the pop-up
  newLog = {
    date: '',
    start: '',
    end: '',
    break: 0
  };

  // Stats cards data
  stats = [
    { label: "Today's Hours", value: '0 hrs', icon: 'schedule', color: 'blue' },
    { label: 'This Week', value: '23.3 hrs', icon: 'calendar_today', color: 'green' },
    { label: 'Days Logged', value: '3 days', icon: 'event_available', color: 'purple' }
  ];

  openModal(): void {
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.resetForm();
  }

  saveLog(): void {
    if (this.newLog.date && this.newLog.start && this.newLog.end) {
      const start = new Date(`2025-01-01T${this.newLog.start}:00`);
      const end = new Date(`2025-01-01T${this.newLog.end}:00`);

      const diffMs = end.getTime() - start.getTime();
      const totalHours = (diffMs / (1000 * 60 * 60)) - (this.newLog.break / 60);

      // Add new log to the beginning of the array passed from parent
      this.logs.unshift({
        date: this.formatDate(this.newLog.date),
        start: this.newLog.start,
        end: this.newLog.end,
        break: this.newLog.break,
        total: totalHours > 0 ? totalHours.toFixed(2) : '0.00'
      });

      this.closeModal();
    }
  }

  private resetForm() {
    this.newLog = { date: '', start: '', end: '', break: 0 };
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }
}