import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ApiResponse, TeamTimeLog, DashboardStats } from '../models/time-log.model';

export interface TimeLog {
  id?: string;
  employee: string;
  employeeId?: string;           // Prefer using this in UI instead of matching by name
  date: string;
  startTime: string;
  endTime?: string;              // Optional - for ongoing logs
  break: number;                 // in minutes
  totalHours: number;
  currentHours?: number;         // Real-time display for ongoing logs
  description?: string;
  status?: 'Pending' | 'Approved' | 'Rejected' | 'In Progress';
  createdDate?: Date;
  isLive?: boolean;              // Indicates if this is a live/ongoing log
}

@Injectable({ providedIn: 'root' })
export class TimeLogService {
  private apiService = inject(ApiService);
  private http = inject(HttpClient);

  private readonly baseUrl = '/api';
  private readonly refreshInterval = 5000; // Refresh live hours every 5s

  private logsSubject = new BehaviorSubject<TimeLog[]>([]);
  logs$ = this.logsSubject.asObservable();

  constructor() {
    this.loadLogs();
    this.startRealtimeUpdates();
  }

  // ---------------------------
  // Load & Realtime
  // ---------------------------

  /** Load logs from API (no dummy/local fallback) */
  private loadLogs(): void {
    this.apiService.getTimeLogs().subscribe({
      next: (logs: any[]) => {
        const list = Array.isArray(logs) ? logs : [];
        this.logsSubject.next(list);
      },
      error: (err) => {
        console.error('Error loading time logs:', err);
        this.logsSubject.next([]); // start clean
      }
    });
  }

  /** Recalculate current/live hours at an interval */
  private startRealtimeUpdates(): void {
    interval(this.refreshInterval).subscribe(() => {
      const currentLogs = this.logsSubject.value;
      const updatedLogs = this.calculateLiveHours(currentLogs);
      this.logsSubject.next(updatedLogs);
    });
  }

  /** Compute live hours for ongoing logs */
  private calculateLiveHours(logs: TimeLog[]): TimeLog[] {
    const now = new Date();
    const currentTimeStr = now.toTimeString().slice(0, 5); // "HH:MM"

    return logs.map(log => {
      if (!log?.isLive || log.status !== 'In Progress') return log;

      const hours = this.calculateHours(log.startTime, currentTimeStr, log.break);
      return {
        ...log,
        currentHours: Math.max(0, hours),
        totalHours: Math.max(0, hours)
      };
    });
  }

  // ---------------------------
  // Auth header helper (standardized)
  // ---------------------------

  /** Read token from the same place as other services: localStorage['user_session'].token */
  private getAuthHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (typeof window !== 'undefined' && window.localStorage) {
      const userSession = localStorage.getItem('user_session');
      if (userSession) {
        try {
          const user = JSON.parse(userSession);
          if (user?.token) headers = headers.set('Authorization', `Bearer ${user.token}`);
        } catch {
          // ignore parse errors
        }
      }
    }
    return headers;
  }

  // ---------------------------
  // Team endpoints (GUID string IDs)
  // ---------------------------

  /** Get team time logs for a manager (managerId is GUID string) */
  getTeamTimeLogs(managerId: string): Observable<TeamTimeLog[]> {
    const id = encodeURIComponent(managerId);
    return this.http
      .get<ApiResponse<TeamTimeLog[]>>(`${this.baseUrl}/TimeLog/team/${id}`, {
        headers: this.getAuthHeaders()
      })
      .pipe(map(response => response?.data || []));
  }

  /** Get dashboard stats for manager (team members + hours today) */
  getManagerDashboardStats(managerId: string): Observable<{ teamMembersCount: number; teamHoursToday: number } | null> {
    const id = encodeURIComponent(managerId);
    return this.http
      .get<ApiResponse<{ teamMembersCount: number; teamHoursToday: number }>>(
        `${this.baseUrl}/TimeLog/team/${id}/stats`,
        { headers: this.getAuthHeaders() }
      )
      .pipe(
        map(response => response?.data ?? null),
        catchError(() => of(null))
      );
  }

  /** Get dashboard stats via User API (if you have this route) */
  getDashboardStats(managerId: string): Observable<DashboardStats | null> {
    const id = encodeURIComponent(managerId);
    return this.http
      .get<ApiResponse<DashboardStats>>(`${this.baseUrl}/User/manager-dashboard/${id}`, {
        headers: this.getAuthHeaders()
      })
      .pipe(
        map(response => response?.data ?? null),
        catchError(() => of(null))
      );
  }

  /** Alias for getDashboardStats */
  getManagerStats(id: string): Observable<DashboardStats | null> {
    const encoded = encodeURIComponent(id);
    return this.http
      .get<ApiResponse<DashboardStats>>(`${this.baseUrl}/User/manager-dashboard/${encoded}`, {
        headers: this.getAuthHeaders()
      })
      .pipe(
        map(response => response?.data ?? null),
        catchError(() => of(null))
      );
  }

  /** Derived helpers */
  getTeamMembersCount(managerId: string): Observable<number> {
    return this.getTeamTimeLogs(managerId).pipe(
      map(logs => new Set(logs.map(log => log.employeeName).filter(Boolean)).size)
    );
  }

  getTeamHoursToday(managerId: string, today: Date = new Date()): Observable<number> {
    const todayKey = today.toDateString();
    return this.getTeamTimeLogs(managerId).pipe(
      map(logs => logs.reduce((sum, log) => {
        const logDate = new Date(log.date);
        if (Number.isNaN(logDate.getTime())) return sum;
        return logDate.toDateString() === todayKey ? sum + (log.totalHours || 0) : sum;
      }, 0))
    );
  }

  // ---------------------------
  // Local list utilities (backed by API)
  // ---------------------------

  /** Get all time logs as an observable */
  getLogs(): Observable<TimeLog[]> {
    return this.logs$;
  }

  /** Add a new time log via API and update local stream */
  addLog(log: TimeLog) {
    // Set defaults client-side (server can also enforce)
    log.id = log.id || `log_${Date.now()}`;
    log.createdDate = log.createdDate || new Date();
    log.status = log.status || 'Pending';

    this.apiService.createTimeLog(log).subscribe({
      next: (created) => {
        const current = this.logsSubject.value;
        this.logsSubject.next([...current, created ?? log]); // fallback to sent log if API returns no body
      },
      error: (err) => {
        console.error('Error creating time log:', err);
        // If you want strict API-only, remove this fallback:
        const current = this.logsSubject.value;
        this.logsSubject.next([...current, log]);
      }
    });
  }

  /** Update an existing time log via API (recalculates hours if time fields change) */
  updateLog(id: string, updatedLog: Partial<TimeLog>) {
    const currentLogs = this.logsSubject.value;
    const index = currentLogs.findIndex(l => l.id === id);
    if (index === -1) return;

    // Recalculate totalHours if time fields changed
    if (updatedLog.startTime || updatedLog.endTime || updatedLog.break !== undefined) {
      const startTime = updatedLog.startTime ?? currentLogs[index].startTime;
      const endTime = updatedLog.endTime ?? currentLogs[index].endTime;
      const breakTime = updatedLog.break ?? currentLogs[index].break;
      if (startTime && endTime) {
        updatedLog.totalHours = this.calculateHours(startTime, endTime, breakTime);
      }
    }

    const payload = { ...currentLogs[index], ...updatedLog };

    this.apiService.updateTimeLog(id, payload).subscribe({
      next: (result) => {
        currentLogs[index] = result ?? payload;
        this.logsSubject.next([...currentLogs]);
      },
      error: (err) => {
        console.error('Error updating time log:', err);
        // Fallback: update local store anyway (remove if you want strict API)
        currentLogs[index] = payload;
        this.logsSubject.next([...currentLogs]);
      }
    });
  }

  /** Remove a time log from local stream (add API delete if available) */
  deleteLog(id: string) {
    // If you have API: this.apiService.deleteTimeLog(id).subscribe(...);
    const current = this.logsSubject.value;
    this.logsSubject.next(current.filter(l => l.id !== id));
  }

  approveLog(id: string) {
    this.updateLog(id, { status: 'Approved' });
  }

  rejectLog(id: string) {
    this.updateLog(id, { status: 'Rejected' });
  }

  getLogsByEmployee(employee: string): TimeLog[] {
    return this.logsSubject.value.filter(
      log => log.employee.toLowerCase() === employee.toLowerCase()
    );
  }

  getLogsByDate(date: string): TimeLog[] {
    return this.logsSubject.value.filter(log => log.date === date);
  }

  getLogsByStatus(status: string): TimeLog[] {
    return this.logsSubject.value.filter(log => log.status === status);
  }

  getTotalHoursByEmployee(employee: string): number {
    return this.getLogsByEmployee(employee).reduce((total, log) => total + log.totalHours, 0);
  }

  // ---------------------------
  // Calculations & Session support
  // ---------------------------

  /** Calculate hours between start and end time minus break (capped at 24h) */
  private calculateHours(startTime: string, endTime: string, breakMinutes: number): number {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;

    // Support midnight crossing
    let workingMinutes = endTotalMin - startTotalMin - breakMinutes;
    if (workingMinutes < 0) workingMinutes += 24 * 60;

    let hours = workingMinutes / 60;
    if (hours > 24) hours = 24;
    return hours;
  }

  /**
   * Persist daily time log from a running timer session (stored in localStorage by UI)
   * - Caps daily hours at 24h
   * - If day boundary crossed, ends at midnight
   */
  saveDailyTimeLog(): void {
    const timerSession = localStorage.getItem('timerSession');
    if (!timerSession) return;

    try {
      const session = JSON.parse(timerSession);
      const sessionStartTime = new Date(session.startTime);
      let currentTime = new Date();

      // If crossed into next day, cap at midnight of the session day
      const sessionDate = new Date(sessionStartTime);
      sessionDate.setHours(0, 0, 0, 0);

      const currentDate = new Date(currentTime);
      currentDate.setHours(0, 0, 0, 0);

      if (currentDate.getTime() > sessionDate.getTime()) {
        currentTime = new Date(sessionDate);
        currentTime.setDate(currentTime.getDate() + 1); // midnight next day
        currentTime.setHours(0, 0, 0, 0);
      }

      // Hours between start and capped end
      const totalSeconds = Math.floor((currentTime.getTime() - sessionStartTime.getTime()) / 1000);
      let totalHours = totalSeconds / 3600;
      if (totalHours > 24) totalHours = 24;

      // User name for the log
      const userSession = localStorage.getItem('user_session');
      const userData = userSession ? JSON.parse(userSession) : {};
      const employeeName = userData.fullName || userData.name || 'Employee';

      // Create time log
      const newLog: TimeLog = {
        id: Date.now().toString(),
        employee: employeeName,
        date: sessionStartTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        startTime: sessionStartTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        endTime: currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        break: 0,
        totalHours,
        status: 'Pending'
      };

      // Save via API + update local stream
      this.addLog(newLog);

      // Clear session
      localStorage.removeItem('timerSession');
    } catch (error) {
      console.error('Error saving daily time log:', error);
    }
  }
}