import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

// Child Components - Ensure these class names match your child component files
import { LogHoursComponent } from '../loghours/loghours.component';
import { TasksComponent } from '../tasksassigned/tasksassigned.component';
import { PersonalreportsComponent } from '../personalreports/personalreports.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  // These must be imported here for the HTML to work
  imports: [
    CommonModule,
    FormsModule,
    LogHoursComponent,
    TasksComponent,
    PersonalreportsComponent
  ],
  templateUrl: './dashboardemployee.component.html',
  styleUrls: ['./dashboardemployee.component.css']
})
export class DashboardemployeeComponent implements OnInit {
  public authService = inject(AuthService);
  private router = inject(Router);

  activeTab = signal<string>('logging');
  showModal = signal<boolean>(false);

  // Time Logs Data
  timeLogs = signal<any[]>([
    { date: 'Sun, Dec 15', start: '09:00', end: '17:30', break: 60, total: 7.50 },
    { date: 'Sat, Dec 14', start: '09:00', end: '18:00', break: 60, total: 8.00 },
    { date: 'Fri, Dec 13', start: '09:15', end: '17:45', break: 45, total: 7.75 }
  ]);

  // Tasks Data
  detailedTasks = signal<any[]>([
    { id: 1, title: 'Implement User Authentication Module', status: 'In Progress', currentHours: 13.5, totalHours: 16, progress: 84 },
    { id: 2, title: 'Design Database Schema', status: 'Completed', currentHours: 5.5, totalHours: 8, progress: 68 }
  ]);

  // Notifications Data
  notifications = signal<any[]>([
    { id: 1, type: 'success', icon: '📗', message: 'New task assigned: Code Review - Time Logging Module', time: 'Dec 15, 10:30 AM', status: 'unread' },
    { id: 2, type: 'warning', icon: '🔔', message: 'Task "Implement User Authentication Module" is due in 2 days', time: 'Dec 15, 9:00 AM', status: 'unread' },
    { id: 3, type: 'info', icon: '🕒', message: 'Remember to log your hours for yesterday', time: 'Dec 14, 5:00 PM', status: 'read' }
  ]);

  // Computeds
  weeklyHours = computed(() => Number(this.timeLogs().reduce((acc, log) => acc + log.total, 0).toFixed(2)));
  unreadCount = computed(() => this.notifications().filter(n => n.status === 'unread').length);

  ngOnInit() {
    if (!this.authService.currentUser()) {
      this.router.navigate(['/login']);
    }
  }

  setTab(tab: string) {
    this.activeTab.set(tab);
  }

  // FIXED: This function was missing, causing the NG9 error
  markAllRead() {
    this.notifications.update(notifs =>
      notifs.map(n => ({ ...n, status: 'read' }))
    );
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}