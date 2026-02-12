import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, of } from 'rxjs';
import { tap, switchMap, map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ApiResponse, TeamTimeLog, DashboardStats } from '../models/time-log.model';

export interface TimeLog {
    id?: string;
    employee: string;
    employeeId?: string;
    date: string;
    startTime: string;
    endTime?: string;  // Optional - for ongoing logs
    break: number; // in minutes
    totalHours: number;
    currentHours?: number; // Real-time hours for ongoing logs
    description?: string;
    status?: 'Pending' | 'Approved' | 'Rejected' | 'In Progress';
    createdDate?: Date;
    isLive?: boolean; // Indicates if this is a live/ongoing log
}

@Injectable({
    providedIn: 'root'
})
export class TimeLogService {
    private apiService = inject(ApiService);
    private http = inject(HttpClient);
    private baseUrl = '/api';

    private initialLogs: TimeLog[] = [];

    private logsSubject = new BehaviorSubject<TimeLog[]>(this.initialLogs);
    logs$ = this.logsSubject.asObservable();
    private refreshInterval = 5000; // Refresh every 5 seconds

    constructor() {
        this.loadLogs();
        this.startRealtimeUpdates();
    }

    /**
     * Start real-time updates of logs with live hour calculations
     */
    private startRealtimeUpdates(): void {
        interval(this.refreshInterval).subscribe(() => {
            const currentLogs = this.logsSubject.value;
            const updatedLogs = this.calculateLiveHours(currentLogs);
            this.logsSubject.next(updatedLogs);
        });
    }

    /**
     * Calculate live hours for ongoing logs
     */
    private calculateLiveHours(logs: TimeLog[]): TimeLog[] {
        const now = new Date();
        const currentTimeStr = now.toTimeString().slice(0, 5); // HH:MM format
        
        return logs.map(log => {
            if (!log || !log.isLive || log.status !== 'In Progress') {
                return log;
            }

            if (log.isLive && log.status === 'In Progress') {
                const hours = this.calculateHours(log.startTime, currentTimeStr, log.break);
                return {
                    ...log,
                    currentHours: Math.max(0, hours),
                    totalHours: Math.max(0, hours)
                };
            }
            return log;
        });
    }

    /**
     * Load time logs from localStorage, API, or initialLogs
     */
    private loadLogs(): void {
        // Try to load from localStorage first (persistent storage)
        const savedLogs = this.loadLogsFromStorage();
        if (savedLogs && savedLogs.length > 0) {
            this.logsSubject.next(savedLogs);
            return;
        }

        // If no localStorage data, try API
        this.apiService.getTimeLogs().subscribe({
            next: (logs: any[]) => {
                if (logs && logs.length > 0) {
                    this.logsSubject.next(logs);
                    this.saveLogsToStorage(logs);
                } else {
                    // Already set initial logs in BehaviorSubject constructor
                    this.saveLogsToStorage(this.initialLogs);
                }
            },
            error: (err) => {
                console.error('Error loading time logs:', err);
                // Already set initial logs in BehaviorSubject constructor
                this.saveLogsToStorage(this.initialLogs);
            }
        });
    }

    /**
     * Load time logs from localStorage
     */
    private loadLogsFromStorage(): TimeLog[] {
        if (typeof window === 'undefined' || !window.localStorage) {
            return [];
        }
        try {
            const stored = localStorage.getItem('timeLogs');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading logs from storage:', error);
            return [];
        }
    }

    /**
     * Save time logs to localStorage
     */
    private saveLogsToStorage(logs: TimeLog[]): void {
        if (typeof window === 'undefined' || !window.localStorage) {
            return;
        }
        try {
            localStorage.setItem('timeLogs', JSON.stringify(logs));
        } catch (error) {
            console.error('Error saving logs to storage:', error);
        }
    }

    /**
     * Get all time logs
     */
    getLogs(): Observable<TimeLog[]> {
        return this.logs$;
    }

    /**
     * Get team time logs for a manager
     */
    getTeamTimeLogs(managerId: number): Observable<TeamTimeLog[]> {
        return this.http
            .get<ApiResponse<TeamTimeLog[]>>(`${this.baseUrl}/TimeLog/team/${managerId}`, {
                headers: this.getAuthHeaders()
            })
            .pipe(map(response => response?.data || []));
    }

    /**
     * Get dashboard stats for manager (team members + hours today)
     */
    getManagerDashboardStats(managerId: number): Observable<{ teamMembersCount: number; teamHoursToday: number } | null> {
        return this.http
            .get<ApiResponse<{ teamMembersCount: number; teamHoursToday: number }>>(`${this.baseUrl}/TimeLog/team/${managerId}/stats`, {
                headers: this.getAuthHeaders()
            })
            .pipe(
                map(response => response?.data ?? null),
                catchError(() => of(null))
            );
    }

    /**
     * Get dashboard stats for manager from User API
     */
    getDashboardStats(managerId: number): Observable<DashboardStats | null> {
        return this.http
            .get<ApiResponse<DashboardStats>>(`${this.baseUrl}/User/manager-dashboard/${managerId}`, {
                headers: this.getAuthHeaders()
            })
            .pipe(
                map(response => response?.data ?? null),
                catchError(() => of(null))
            );
    }

    /**
     * Get manager stats (alias for getDashboardStats)
     */
    getManagerStats(id: number): Observable<DashboardStats | null> {
        return this.http
            .get<ApiResponse<DashboardStats>>(`${this.baseUrl}/User/manager-dashboard/${id}`, {
                headers: this.getAuthHeaders()
            })
            .pipe(
                map(response => response?.data ?? null),
                catchError(() => of(null))
            );
    }

    getTeamMembersCount(managerId: number): Observable<number> {
        return this.getTeamTimeLogs(managerId).pipe(
            map(logs => new Set(logs.map(log => log.employeeName).filter(Boolean)).size)
        );
    }

    getTeamHoursToday(managerId: number, today: Date = new Date()): Observable<number> {
        const todayKey = today.toDateString();
        return this.getTeamTimeLogs(managerId).pipe(
            map(logs => logs.reduce((sum, log) => {
                const logDate = new Date(log.date);
                if (Number.isNaN(logDate.getTime())) {
                    return sum;
                }
                return logDate.toDateString() === todayKey ? sum + (log.totalHours || 0) : sum;
            }, 0))
        );
    }

    /**
     * Get time logs for a specific employee
     */
    getLogsByEmployee(employee: string): TimeLog[] {
        return this.logsSubject.value.filter(log => log.employee.toLowerCase() === employee.toLowerCase());
    }

    /**
     * Get time logs by date
     */
    getLogsByDate(date: string): TimeLog[] {
        return this.logsSubject.value.filter(log => log.date === date);
    }

    /**
     * Get logs by status
     */
    getLogsByStatus(status: string): TimeLog[] {
        return this.logsSubject.value.filter(log => log.status === status);
    }

    private getAuthHeaders(): HttpHeaders {
        let headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });

        if (typeof window !== 'undefined' && window.localStorage) {
            const token = localStorage.getItem('token');
            if (token) {
                headers = headers.set('Authorization', `Bearer ${token}`);
            }
        }

        return headers;
    }

    /**
     * Add a new time log (creates via API and persists to localStorage)
     */
    addLog(log: TimeLog) {
        log.id = log.id || `log_${Date.now()}`;
        log.createdDate = new Date();
        log.status = log.status || 'Pending';
        
        // Call API to create time log
        this.apiService.createTimeLog(log).subscribe({
            next: (newLog) => {
                const currentLogs = this.logsSubject.value;
                const updatedLogs = [...currentLogs, newLog];
                this.logsSubject.next(updatedLogs);
                this.saveLogsToStorage(updatedLogs);
            },
            error: (err) => {
                console.error('Error creating time log:', err);
                // Fallback: add locally and persist to localStorage
                const currentLogs = this.logsSubject.value;
                const updatedLogs = [...currentLogs, log];
                this.logsSubject.next(updatedLogs);
                this.saveLogsToStorage(updatedLogs);
            }
        });
    }

    /**
     * Update an existing time log (updates via API and persists to localStorage)
     */
    updateLog(id: string, updatedLog: Partial<TimeLog>) {
        const currentLogs = this.logsSubject.value;
        const index = currentLogs.findIndex(log => log.id === id);
        if (index !== -1) {
            // Recalculate totalHours if startTime, endTime, or break changed
            if (updatedLog.startTime || updatedLog.endTime || updatedLog.break !== undefined) {
                const startTime = updatedLog.startTime || currentLogs[index].startTime;
                const endTime = updatedLog.endTime || currentLogs[index].endTime;
                const breakTime = updatedLog.break !== undefined ? updatedLog.break : currentLogs[index].break;
                
                // Only calculate if both startTime and endTime are available
                if (startTime && endTime) {
                    updatedLog.totalHours = this.calculateHours(startTime, endTime, breakTime);
                }
            }
            const updated = { ...currentLogs[index], ...updatedLog };
            
            // Call API to update time log
            this.apiService.updateTimeLog(id, updated).subscribe({
                next: (result) => {
                    currentLogs[index] = result;
                    const updatedLogs = [...currentLogs];
                    this.logsSubject.next(updatedLogs);
                    this.saveLogsToStorage(updatedLogs);
                },
                error: (err) => {
                    console.error('Error updating time log:', err);
                    // Fallback: update locally and persist to localStorage
                    currentLogs[index] = updated;
                    const updatedLogs = [...currentLogs];
                    this.logsSubject.next(updatedLogs);
                    this.saveLogsToStorage(updatedLogs);
                }
            });
        }
    }

    /**
     * Delete a time log (removes from memory and localStorage)
     */
    deleteLog(id: string) {
        const currentLogs = this.logsSubject.value;
        const updatedLogs = currentLogs.filter(log => log.id !== id);
        this.logsSubject.next(updatedLogs);
        this.saveLogsToStorage(updatedLogs);
    }

    /**
     * Approve a time log
     */
    approveLog(id: string) {
        this.updateLog(id, { status: 'Approved' });
    }

    /**
     * Reject a time log
     */
    rejectLog(id: string) {
        this.updateLog(id, { status: 'Rejected' });
    }

    /**
     * Get total hours for an employee
     */
    getTotalHoursByEmployee(employee: string): number {
        const logs = this.getLogsByEmployee(employee);
        return logs.reduce((total, log) => total + log.totalHours, 0);
    }

    /**
     * Calculate hours between start and end time minus break
     * Caps at maximum 24 hours per day
     */
    private calculateHours(startTime: string, endTime: string, breakMinutes: number): number {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);

        const startTotalMin = startHour * 60 + startMin;
        const endTotalMin = endHour * 60 + endMin;

        // Handle midnight crossing (if end time is before start time on same day display)
        let workingMinutes = endTotalMin - startTotalMin - breakMinutes;
        
        // If working minutes is negative, add 24 hours (crossed midnight)
        if (workingMinutes < 0) {
            workingMinutes += 24 * 60;
        }

        let hours = workingMinutes / 60;
        
        // Cap at 24 hours maximum per day
        if (hours > 24) {
            hours = 24;
        }
        
        return hours;
    }

    /**
     * Get logs count by status
     */
    getLogCountByStatus(status: string): number {
        return this.logsSubject.value.filter(log => log.status === status).length;
    }

    /**
     * Save daily time log from timer session
     * Called when employee logs out
     * Caps daily hours at 24 hours and ends at midnight (12:00 AM)
     */
    saveDailyTimeLog(): void {
        const timerSession = localStorage.getItem('timerSession');
        if (!timerSession) return;

        try {
            const session = JSON.parse(timerSession);
            const sessionStartTime = new Date(session.startTime);
            let currentTime = new Date();
            
            // Check if we've crossed into the next day
            const sessionDate = new Date(sessionStartTime);
            sessionDate.setHours(0, 0, 0, 0);
            
            const currentDate = new Date(currentTime);
            currentDate.setHours(0, 0, 0, 0);
            
            // If we're on a different day, cap the log at midnight of the session day
            if (currentDate.getTime() > sessionDate.getTime()) {
                currentTime = new Date(sessionDate);
                currentTime.setDate(currentTime.getDate() + 1); // Set to midnight of next day
                currentTime.setHours(0, 0, 0, 0);
            }
            
            // Calculate total hours
            const totalSeconds = Math.floor((currentTime.getTime() - sessionStartTime.getTime()) / 1000);
            let totalHours = totalSeconds / 3600;
            
            // Cap at 24 hours maximum per day
            if (totalHours > 24) {
                totalHours = 24;
            }

            // Get employee name from user session
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
                totalHours: totalHours,
                status: 'Pending'
            };

            // Add the log
            this.addLog(newLog);

            // Clear the timer session
            localStorage.removeItem('timerSession');
        } catch (error) {
            console.error('Error saving daily time log:', error);
        }
    }
}
