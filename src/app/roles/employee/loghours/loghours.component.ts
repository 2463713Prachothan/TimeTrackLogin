import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { TimeLogService, TimeLog as ServiceTimeLog } from '../../../core/services/time-log.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';


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
  imports: [CommonModule],
  templateUrl: './loghours.component.html',
  styleUrl: './loghours.component.css',
})
export class LogHoursComponent implements OnInit, OnDestroy {
  // Inject services
  private timeLogService = inject(TimeLogService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  logs: TimeLog[] = [];

  // Statistics
  todayHours: number = 0;
  thisWeekHours: number = 0;
  daysLogged: number = 0;

  // Simple Time Tracking - just display running time
  elapsedSeconds: number = 0;
  displayTime: string = '00:00:00';
  timerInterval: any = null;
  sessionStartTime: Date | null = null;
  employeeName: string = 'Employee';

  ngOnInit() {
    // Get employee name
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.employeeName = currentUser.fullName || currentUser.name || 'Employee';
    }

    // Load time logs first, then start timer if appropriate
    this.loadTimeLogs();

    // Subscribe to logs updates to recalculate stats
    this.timeLogService.getLogs().subscribe(() => {
      this.calculateStatistics();
    });
  }

  ngOnDestroy() {
    // Save session to localStorage before destroying component
    if (this.sessionStartTime && this.timerInterval) {
      this.saveSessionToStorage();
    }
    
    // Don't clear the interval - let it keep running globally
    // Only clear if component is truly being destroyed (not just navigating away)
  }

  /**
   * Restore session from localStorage or start a new one
   */
  private restoreOrStartSession() {
    // Check if there's already a completed log for today
    if (this.hasCompletedLogForToday()) {
      // Don't start a new timer - user already logged out today
      return;
    }

    const savedSession = localStorage.getItem('timerSession');
    
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        this.sessionStartTime = new Date(session.startTime);
        // Calculate elapsed time based on actual time difference
        // This ensures if tab was closed, we still get accurate time
        const timeNow = new Date();
        const timeDiffMs = timeNow.getTime() - this.sessionStartTime.getTime();
        this.elapsedSeconds = Math.floor(timeDiffMs / 1000) + session.bonusSeconds;
        this.updateDisplayTime();
        // Resume the timer
        this.resumeTimer();
      } catch (error) {
        // If parsing fails, start fresh
        this.startNewSession();
      }
    } else {
      // Start a new session for today (first login)
      this.startNewSession();
    }
  }

  /**
   * Check if employee already has a completed log for today
   */
  private hasCompletedLogForToday(): boolean {
    const today = new Date();
    const todayString = today.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });

    // Check if there's a log from today
    const todayLog = this.logs.find(log => log.date === todayString);
    
    if (todayLog) {
      // Load the final time from today's completed log
      this.sessionStartTime = null; // No active session
      this.elapsedSeconds = 0; // Don't accumulate more time
      
      // Display the final hours from today's log
      const totalSeconds = parseFloat(todayLog.totalHours) * 3600;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = Math.floor(totalSeconds % 60);
      
      this.displayTime = [hours, minutes, seconds]
        .map(val => val.toString().padStart(2, '0'))
        .join(':');
      
      return true;
    }
    
    return false;
  }

  /**
   * Start a new timer session
   */
  private startNewSession() {
    this.sessionStartTime = new Date();
    this.elapsedSeconds = 0;
    this.displayTime = '00:00:00';
    this.resumeTimer();
    this.saveSessionToStorage();
  }

  /**
   * Resume the timer interval
   */
  private resumeTimer() {
    // Clear any existing interval first
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds++;
      this.updateDisplayTime();
      this.saveSessionToStorage(); // Save every second to keep it in sync
    }, 1000);
  }

  /**
   * Save session to localStorage
   * Stores start time and bonus seconds (for manual additions)
   */
  private saveSessionToStorage() {
    if (this.sessionStartTime) {
      localStorage.setItem('timerSession', JSON.stringify({
        startTime: this.sessionStartTime.toISOString(),
        bonusSeconds: 0
      }));
    }
  }

  /**
   * Save the final time log when user logs out
   * Caps at 24 hours and stops at midnight
   */
  saveAndClearSession(): void {
    if (!this.sessionStartTime) return;

    // Calculate total hours worked today
    let timeNow = new Date();
    
    // Check if we've crossed into the next day
    const sessionDate = new Date(this.sessionStartTime);
    sessionDate.setHours(0, 0, 0, 0);
    
    const currentDate = new Date(timeNow);
    currentDate.setHours(0, 0, 0, 0);
    
    // If we're on a different day, cap the log at midnight of the session day
    if (currentDate.getTime() > sessionDate.getTime()) {
      timeNow = new Date(sessionDate);
      timeNow.setDate(timeNow.getDate() + 1); // Set to midnight of next day
      timeNow.setHours(0, 0, 0, 0);
    }
    
    const totalSeconds = Math.floor((timeNow.getTime() - this.sessionStartTime.getTime()) / 1000);
    let totalHours = totalSeconds / 3600;
    
    // Cap at 24 hours maximum per day
    if (totalHours > 24) {
      totalHours = 24;
    }

    // Create time log entry
    const todayDate = new Date();
    const currentUser = this.authService.currentUser();
    const newTimeLog: ServiceTimeLog = {
      employee: this.employeeName,
      employeeId: currentUser?.id,
      date: this.sessionStartTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      startTime: this.sessionStartTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      endTime: timeNow.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      break: 0,
      totalHours: totalHours,
      status: 'Pending'
    };

    // Save to the service
    this.timeLogService.addLog(newTimeLog);

    console.log('Time log created:', newTimeLog);

    // Clear session from storage
    localStorage.removeItem('timerSession');
    this.sessionStartTime = null;
    this.elapsedSeconds = 0;
    this.displayTime = '00:00:00';

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Start the timer automatically
   * Stops at 24 hours (86400 seconds) per day
   */
  private startTimer() {
    this.sessionStartTime = new Date();
    this.timerInterval = setInterval(() => {
      const MAX_SECONDS_PER_DAY = 24 * 3600; // 24 hours = 86400 seconds
      
      // Only increment if under 24 hours
      if (this.elapsedSeconds < MAX_SECONDS_PER_DAY) {
        this.elapsedSeconds++;
      } else {
        // Stop the timer at 24 hours
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }
      }
      this.updateDisplayTime();
    }, 1000);
  }

  /**
   * Update display time format (HH:MM:SS)
   * Caps at 24 hours maximum per day
   */
  private updateDisplayTime() {
    let hours = Math.floor(this.elapsedSeconds / 3600);
    const minutes = Math.floor((this.elapsedSeconds % 3600) / 60);
    const seconds = this.elapsedSeconds % 60;
    
    // Cap at 24 hours maximum per day
    if (hours > 24) {
      hours = 24;
    }

    this.displayTime = [hours, minutes, seconds]
      .map(val => val.toString().padStart(2, '0'))
      .join(':');
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
          endTime: log.endTime || '', // Handle optional endTime
          breakMin: log.break,
          totalHours: log.totalHours.toFixed(2)
        }));

        // Calculate statistics
        this.calculateStatistics();

        // Now that logs are loaded, check if we should start the timer
        this.restoreOrStartSession();
      },
      (error) => {
        console.error('Error loading time logs:', error);
        this.notificationService.error('Failed to load time logs');
      }
    );
  }

  /**
   * Calculate statistics from logs
   */
  private calculateStatistics() {
    // Get today's date in the same format as stored dates (e.g., "Jan 23")
    const today = new Date();
    const todayString = today.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    // Calculate today's hours
    this.todayHours = this.logs
      .filter(log => log.date.includes(todayString))
      .reduce((sum, log) => sum + parseFloat(log.totalHours), 0);

    // Calculate this week's hours (last 7 days)
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    this.thisWeekHours = this.logs
      .filter(log => {
        const logDate = this.parseDate(log.date);
        return logDate >= sevenDaysAgo && logDate <= today;
      })
      .reduce((sum, log) => sum + parseFloat(log.totalHours), 0);

    // Count days logged
    this.daysLogged = this.logs.length;
  }

  /**
   * Parse date string to Date object
   */
  private parseDate(dateString: string): Date {
    const today = new Date();
    const year = today.getFullYear();
    return new Date(`${dateString}, ${year}`);
  }
}