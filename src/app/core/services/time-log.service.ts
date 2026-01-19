import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface TimeLog {
    id?: string;
    employee: string;
    employeeId?: string;
    date: string;
    startTime: string;
    endTime: string;
    break: number; // in minutes
    totalHours: number;
    description?: string;
    status?: 'Pending' | 'Approved' | 'Rejected';
    createdDate?: Date;
}

@Injectable({
    providedIn: 'root'
})
export class TimeLogService {

    private initialLogs: TimeLog[] = [
        {
            id: '1',
            employee: 'Akash',
            date: 'Jan 12',
            startTime: '09:00',
            endTime: '17:30',
            break: 60,
            totalHours: 7.50,
            status: 'Approved'
        },
        {
            id: '2',
            employee: 'Chandana',
            date: 'Jan 12',
            startTime: '08:30',
            endTime: '17:00',
            break: 60,
            totalHours: 7.50,
            status: 'Approved'
        },
        {
            id: '3',
            employee: 'Prachothan',
            date: 'Jan 12',
            startTime: '09:00',
            endTime: '18:30',
            break: 60,
            totalHours: 8.50,
            status: 'Pending'
        },
        {
            id: '4',
            employee: 'Akash',
            date: 'Jan 11',
            startTime: '09:00',
            endTime: '18:00',
            break: 60,
            totalHours: 8.00,
            status: 'Approved'
        },
        {
            id: '5',
            employee: 'Chandana',
            date: 'Jan 11',
            startTime: '09:00',
            endTime: '17:00',
            break: 30,
            totalHours: 7.50,
            status: 'Approved'
        },
        {
            id: '6',
            employee: 'Prachothan',
            date: 'Jan 10',
            startTime: '10:00',
            endTime: '19:00',
            break: 60,
            totalHours: 8.00,
            status: 'Approved'
        },
        {
            id: '7',
            employee: 'Gopi Krishna',
            date: 'Jan 12',
            startTime: '10:00',
            endTime: '19:00',
            break: 60,
            totalHours: 8.00,
            status: 'Pending'
        },
        {
            id: '8',
            employee: 'Umesh',
            date: 'Jan 12',
            startTime: '08:00',
            endTime: '16:00',
            break: 60,
            totalHours: 7.00,
            status: 'Approved'
        }
    ];

    private logsSubject = new BehaviorSubject<TimeLog[]>(this.initialLogs);
    logs$ = this.logsSubject.asObservable();

    constructor() { }

    /**
     * Get all time logs
     */
    getLogs(): Observable<TimeLog[]> {
        return this.logs$;
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

    /**
     * Add a new time log
     */
    addLog(log: TimeLog) {
        log.id = log.id || `log_${Date.now()}`;
        log.createdDate = new Date();
        log.status = log.status || 'Pending';
        const currentLogs = this.logsSubject.value;
        this.logsSubject.next([...currentLogs, log]);
    }

    /**
     * Update an existing time log
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
                updatedLog.totalHours = this.calculateHours(startTime, endTime, breakTime);
            }
            currentLogs[index] = { ...currentLogs[index], ...updatedLog };
            this.logsSubject.next([...currentLogs]);
        }
    }

    /**
     * Delete a time log
     */
    deleteLog(id: string) {
        const currentLogs = this.logsSubject.value;
        this.logsSubject.next(currentLogs.filter(log => log.id !== id));
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
     */
    private calculateHours(startTime: string, endTime: string, breakMinutes: number): number {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);

        const startTotalMin = startHour * 60 + startMin;
        const endTotalMin = endHour * 60 + endMin;

        const workingMinutes = endTotalMin - startTotalMin - breakMinutes;
        return workingMinutes / 60;
    }

    /**
     * Get logs count by status
     */
    getLogCountByStatus(status: string): number {
        return this.logsSubject.value.filter(log => log.status === status).length;
    }
}
