import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  // Backend API base URL - Configure this based on your backend
  private apiUrl = 'http://localhost:5000/api'; // Change to your backend URL
  
  // Switch to use mock data if backend is not available
  private useMockData = true; // Set to false when backend is ready

  /**
   * Get HTTP headers with authorization token
   */
  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return headers;
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): Observable<any> {
    console.error('API Error:', error);
    return of(null);
  }

  // ==================== USER ENDPOINTS ====================

  /**
   * Get all users
   * Backend endpoint: GET /api/users
   */
  getUsers(): Observable<any[]> {
    if (this.useMockData) {
      return of([]); // Return empty - will be populated by service
    }
    return this.http.get<any[]>(`${this.apiUrl}/users`, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Get user by ID
   * Backend endpoint: GET /api/users/:id
   */
  getUserById(id: string): Observable<any> {
    if (this.useMockData) {
      return of(null);
    }
    return this.http.get<any>(`${this.apiUrl}/users/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Get user by email
   * Backend endpoint: GET /api/users/email/:email
   */
  getUserByEmail(email: string): Observable<any> {
    if (this.useMockData) {
      return of(null);
    }
    return this.http.get<any>(`${this.apiUrl}/users/email/${email}`, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Create new user
   * Backend endpoint: POST /api/users
   */
  createUser(user: any): Observable<any> {
    if (this.useMockData) {
      return of({ ...user, id: `user_${Date.now()}` });
    }
    return this.http.post<any>(`${this.apiUrl}/users`, user, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Update user
   * Backend endpoint: PUT /api/users/:id
   */
  updateUser(id: string, user: any): Observable<any> {
    if (this.useMockData) {
      return of(user);
    }
    return this.http.put<any>(`${this.apiUrl}/users/${id}`, user, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Delete user
   * Backend endpoint: DELETE /api/users/:id
   */
  deleteUser(id: string): Observable<any> {
    if (this.useMockData) {
      return of({ success: true });
    }
    return this.http.delete<any>(`${this.apiUrl}/users/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Get users by role
   * Backend endpoint: GET /api/users?role=Employee
   */
  getUsersByRole(role: string): Observable<any[]> {
    if (this.useMockData) {
      return of([]);
    }
    return this.http.get<any[]>(`${this.apiUrl}/users?role=${role}`, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  // ==================== TIME LOG ENDPOINTS ====================

  /**
   * Get all time logs
   * Backend endpoint: GET /api/time-logs
   */
  getTimeLogs(): Observable<any[]> {
    if (this.useMockData) {
      return of([]);
    }
    return this.http.get<any[]>(`${this.apiUrl}/time-logs`, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Get time logs for a specific employee
   * Backend endpoint: GET /api/time-logs?employeeId=:id
   */
  getTimeLogsByEmployee(employeeId: string): Observable<any[]> {
    if (this.useMockData) {
      return of([]);
    }
    return this.http.get<any[]>(`${this.apiUrl}/time-logs?employeeId=${employeeId}`, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Get time logs for a specific date
   * Backend endpoint: GET /api/time-logs?date=:date
   */
  getTimeLogsByDate(date: string): Observable<any[]> {
    if (this.useMockData) {
      return of([]);
    }
    return this.http.get<any[]>(`${this.apiUrl}/time-logs?date=${date}`, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Create time log
   * Backend endpoint: POST /api/time-logs
   */
  createTimeLog(timeLog: any): Observable<any> {
    if (this.useMockData) {
      return of({ ...timeLog, id: `log_${Date.now()}` });
    }
    return this.http.post<any>(`${this.apiUrl}/time-logs`, timeLog, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Update time log
   * Backend endpoint: PUT /api/time-logs/:id
   */
  updateTimeLog(id: string, timeLog: any): Observable<any> {
    if (this.useMockData) {
      return of(timeLog);
    }
    return this.http.put<any>(`${this.apiUrl}/time-logs/${id}`, timeLog, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  // ==================== TASK ENDPOINTS ====================

  /**
   * Get all tasks
   * Backend endpoint: GET /api/tasks
   */
  getTasks(): Observable<any[]> {
    if (this.useMockData) {
      // Return tasks from localStorage when using mock data (only on browser)
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const stored = localStorage.getItem('tasks');
          if (stored) {
            return of(JSON.parse(stored));
          }
        } catch (e) {
          console.error('Error loading tasks from storage:', e);
        }
      }
      return of([]);
    }
    return this.http.get<any[]>(`${this.apiUrl}/tasks`, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Get tasks assigned to a specific user
   * Backend endpoint: GET /api/tasks?assignedTo=:userId
   */
  getTasksByAssignee(userId: string): Observable<any[]> {
    if (this.useMockData) {
      return of([]);
    }
    return this.http.get<any[]>(`${this.apiUrl}/tasks?assignedTo=${userId}`, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Create task
   * Backend endpoint: POST /api/tasks
   */
  createTask(task: any): Observable<any> {
    if (this.useMockData) {
      return of({ ...task, id: `task_${Date.now()}` });
    }
    return this.http.post<any>(`${this.apiUrl}/tasks`, task, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Update task
   * Backend endpoint: PUT /api/tasks/:id
   */
  updateTask(id: string, task: any): Observable<any> {
    if (this.useMockData) {
      return of(task);
    }
    return this.http.put<any>(`${this.apiUrl}/tasks/${id}`, task, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Delete task
   * Backend endpoint: DELETE /api/tasks/:id
   */
  deleteTask(id: string): Observable<any> {
    if (this.useMockData) {
      return of({ success: true });
    }
    return this.http.delete<any>(`${this.apiUrl}/tasks/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  // ==================== REGISTRATION ENDPOINTS ====================

  /**
   * Get pending registrations
   * Backend endpoint: GET /api/registrations/pending
   */
  getPendingRegistrations(): Observable<any[]> {
    if (this.useMockData) {
      return of([]);
    }
    return this.http.get<any[]>(`${this.apiUrl}/registrations/pending`, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Approve registration
   * Backend endpoint: POST /api/registrations/:id/approve
   */
  approveRegistration(registrationId: string, userData: any): Observable<any> {
    if (this.useMockData) {
      return of({ ...userData, status: 'approved' });
    }
    return this.http.post<any>(`${this.apiUrl}/registrations/${registrationId}/approve`, userData, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Reject registration
   * Backend endpoint: POST /api/registrations/:id/reject
   */
  rejectRegistration(registrationId: string, reason: string): Observable<any> {
    if (this.useMockData) {
      return of({ success: true });
    }
    return this.http.post<any>(`${this.apiUrl}/registrations/${registrationId}/reject`, { reason }, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Create registration (signup)
   * Backend endpoint: POST /api/registrations
   */
  createRegistration(registration: any): Observable<any> {
    if (this.useMockData) {
      return of({ ...registration, id: `reg_${Date.now()}`, status: 'pending' });
    }
    return this.http.post<any>(`${this.apiUrl}/registrations`, registration, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  // ==================== CONFIGURATION ====================

  /**
   * Set API base URL (call this during app initialization)
   */
  setApiUrl(url: string): void {
    this.apiUrl = url;
  }

  /**
   * Toggle between mock data and real API
   */
  setUseMockData(useMock: boolean): void {
    this.useMockData = useMock;
  }

  /**
   * Get current API URL
   */
  getApiUrl(): string {
    return this.apiUrl;
  }
}
