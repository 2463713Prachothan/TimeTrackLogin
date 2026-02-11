import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  // Use relative URLs - requests will be proxied via proxy.conf.json
  // The proxy handles the SSL certificate issue with the self-signed backend cert
  private apiUrl = '/api';
  
  // All endpoints use real backend API - no mock data
  private useMockForTasks = false;
  private useMockForTimeLogs = false;
  private useMockForUsers = false;

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
   * Backend endpoint: GET /api/User/all
   */
  getUsers(): Observable<any[]> {
    if (this.useMockForUsers) {
      return of([]); // Return empty - will be populated by service from localStorage
    }
    
    // Only fetch in browser (SSR has certificate issues with self-signed certs)
    if (!isPlatformBrowser(this.platformId)) {
      console.log('⚠️ ApiService - Skipping getUsers in SSR');
      return of([]);
    }
    
    console.log('📡 ApiService - Fetching users from:', `${this.apiUrl}/User/all`);
    
    return this.http.get<any>(`${this.apiUrl}/User/all`, { headers: this.getHeaders() })
      .pipe(
        tap((response: any) => {
          console.log('📥 ApiService - Users raw response:', JSON.stringify(response));
        }),
        map((response: any) => {
          
          // Handle different response formats from backend
          let users: any[] = [];
          if (Array.isArray(response)) {
            users = response;
          } else if (response && Array.isArray(response.$values)) {
            users = response.$values;
          } else if (response && Array.isArray(response.data)) {
            users = response.data;
          } else if (response && Array.isArray(response.result)) {
            users = response.result;
          }
          
          // Filter out null/undefined users - check both id and userId
          users = users.filter(u => u != null && (u.id != null || u.userId != null));
          console.log('✅ ApiService - Parsed users:', users.length, users);
          return users;
        }),
        catchError(err => {
          console.error('❌ ApiService - Error fetching users:', err);
          return of([]);
        })
      );
  }
  /**
   * Get current user profile
   * Backend endpoint: GET /api/User/profile
   */
  getUserProfile(): Observable<any> {
    if (!isPlatformBrowser(this.platformId)) {
      return of(null);
    }
    
    return this.http.get<any>(`${this.apiUrl}/User/profile`, { headers: this.getHeaders() })
      .pipe(
        tap((response: any) => {
          console.log('✅ ApiService - User profile response:', response);
        }),
        catchError(err => {
          console.error('❌ ApiService - Error fetching user profile:', err);
          return of(null);
        })
      );
  }

  /**
   * Get users by department
   * Backend endpoint: GET /api/User/department/{department}
   */
  getUsersByDepartment(department: string): Observable<any[]> {
    if (this.useMockForUsers) {
      return of([]);
    }
    
    if (!isPlatformBrowser(this.platformId)) {
      return of([]);
    }
    
    return this.http.get<any[]>(`${this.apiUrl}/User/department/${encodeURIComponent(department)}`, { headers: this.getHeaders() })
      .pipe(
        tap((response: any) => {
          console.log('✅ ApiService - Users by department response:', response);
        }),
        catchError(err => {
          console.error('❌ ApiService - Error fetching users by department:', err);
          return of([]);
        })
      );
  }

  /**
   * Deactivate a user
   * Backend endpoint: PATCH /api/User/{userId}/deactivate
   */
  deactivateUser(userId: string): Observable<any> {
    if (this.useMockForUsers) {
      return of({ success: true });
    }
    
    return this.http.patch<any>(`${this.apiUrl}/User/${userId}/deactivate`, {}, { headers: this.getHeaders() })
      .pipe(
        tap((response: any) => {
          console.log('✅ ApiService - User deactivated:', response);
        }),
        catchError(err => {
          console.error('❌ ApiService - Error deactivating user:', err);
          return of({ success: false });
        })
      );
  }

  /**
   * Activate a user
   * Backend endpoint: PATCH /api/User/{userId}/activate
   */
  activateUser(userId: string): Observable<any> {
    if (this.useMockForUsers) {
      return of({ success: true });
    }
    
    return this.http.patch<any>(`${this.apiUrl}/User/${userId}/activate`, {}, { headers: this.getHeaders() })
      .pipe(
        tap((response: any) => {
          console.log('✅ ApiService - User activated:', response);
        }),
        catchError(err => {
          console.error('❌ ApiService - Error activating user:', err);
          return of({ success: false });
        })
      );
  }

  /**
   * Get user by ID
   * Backend endpoint: GET /api/User/:id
   */
  getUserById(id: string): Observable<any> {
    if (this.useMockForUsers) {
      return of(null);
    }
    return this.http.get<any>(`${this.apiUrl}/User/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Get user by email
   * Backend endpoint: GET /api/User/email/:email
   */
  getUserByEmail(email: string): Observable<any> {
    if (this.useMockForUsers) {
      return of(null);
    }
    return this.http.get<any>(`${this.apiUrl}/User/email/${email}`, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Create new user
   * Backend endpoint: POST /api/User
   */
  createUser(user: any): Observable<any> {
    if (this.useMockForUsers) {
      return of({ ...user, id: `user_${Date.now()}` });
    }
    return this.http.post<any>(`${this.apiUrl}/User`, user, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Update user
   * Backend endpoint: PUT /api/User/:id
   * Always calls API - no mock data
   */
  updateUser(id: string, user: any): Observable<any> {
    console.log('📡 ApiService - Calling PUT /api/User/' + id, user);
    return this.http.put<any>(`${this.apiUrl}/User/${id}`, user, { headers: this.getHeaders() })
      .pipe(
        map((response: any) => {
          console.log('✅ ApiService - User update response:', response);
          return response.data || response;
        }),
        catchError(err => {
          console.error('❌ ApiService - Error updating user:', err);
          return this.handleError(err);
        })
      );
  }

  /**
   * Delete user
   * Backend endpoint: DELETE /api/User/:id
   */
  deleteUser(id: string): Observable<any> {
    if (this.useMockForUsers) {
      return of({ success: true });
    }
    return this.http.delete<any>(`${this.apiUrl}/User/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Get users by role
   * Backend endpoint: GET /api/User?role=Employee
   */
  getUsersByRole(role: string): Observable<any[]> {
    if (this.useMockForUsers) {
      return of([]);
    }
    return this.http.get<any[]>(`${this.apiUrl}/User?role=${role}`, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  // ==================== TIME LOG ENDPOINTS ====================

  /**
   * Get all time logs
   * Backend endpoint: GET /api/TimeLog
   */
  getTimeLogs(): Observable<any[]> {
    if (this.useMockForTimeLogs) {
      return of([]);
    }
    return this.http.get<any[]>(`${this.apiUrl}/TimeLog`, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Get time logs for a specific employee
   * Backend endpoint: GET /api/TimeLog?employeeId=:id
   */
  getTimeLogsByEmployee(employeeId: string): Observable<any[]> {
    if (this.useMockForTimeLogs) {
      return of([]);
    }
    return this.http.get<any[]>(`${this.apiUrl}/TimeLog?employeeId=${employeeId}`, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Get time logs for a specific date
   * Backend endpoint: GET /api/TimeLog?date=:date
   */
  getTimeLogsByDate(date: string): Observable<any[]> {
    if (this.useMockForTimeLogs) {
      return of([]);
    }
    return this.http.get<any[]>(`${this.apiUrl}/TimeLog?date=${date}`, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Create time log
   * Backend endpoint: POST /api/TimeLog
   */
  createTimeLog(timeLog: any): Observable<any> {
    if (this.useMockForTimeLogs) {
      return of({ ...timeLog, id: `log_${Date.now()}` });
    }
    return this.http.post<any>(`${this.apiUrl}/TimeLog`, timeLog, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Update time log
   * Backend endpoint: PUT /api/TimeLog/:id
   */
  updateTimeLog(id: string, timeLog: any): Observable<any> {
    if (this.useMockForTimeLogs) {
      return of(timeLog);
    }
    return this.http.put<any>(`${this.apiUrl}/TimeLog/${id}`, timeLog, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  // ==================== TASK ENDPOINTS ====================

  /**
   * Get all tasks
   * Backend endpoint: GET /api/Task
   */
  getTasks(): Observable<any[]> {
    if (this.useMockForTasks) {
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
    return this.http.get<any[]>(`${this.apiUrl}/Task`, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Get tasks assigned to a specific user
   * Backend endpoint: GET /api/Task?assignedTo=:userId
   */
  getTasksByAssignee(userId: string): Observable<any[]> {
    if (this.useMockForTasks) {
      return of([]);
    }
    return this.http.get<any[]>(`${this.apiUrl}/Task?assignedTo=${userId}`, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Create task
   * Backend endpoint: POST /api/Task
   */
  createTask(task: any): Observable<any> {
    if (this.useMockForTasks) {
      return of({ ...task, id: `task_${Date.now()}` });
    }
    return this.http.post<any>(`${this.apiUrl}/Task`, task, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Update task
   * Backend endpoint: PUT /api/Task/:id
   */
  updateTask(id: string, task: any): Observable<any> {
    if (this.useMockForTasks) {
      return of(task);
    }
    return this.http.put<any>(`${this.apiUrl}/Task/${id}`, task, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  /**
   * Delete task
   * Backend endpoint: DELETE /api/Task/:id
   */
  deleteTask(id: string): Observable<any> {
    if (this.useMockForTasks) {
      return of({ success: true });
    }
    return this.http.delete<any>(`${this.apiUrl}/Task/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
  }

  // ==================== REGISTRATION ENDPOINTS ====================
  // Note: Registration endpoints are now handled directly by RegistrationService
  // using /api/Registration endpoints

  // ==================== CONFIGURATION ====================

  /**
   * Set API base URL (call this during app initialization)
   */
  setApiUrl(url: string): void {
    this.apiUrl = url;
  }

  /**
   * Toggle between mock data and real API for specific services
   */
  setUseMockForTasks(useMock: boolean): void {
    this.useMockForTasks = useMock;
  }

  setUseMockForTimeLogs(useMock: boolean): void {
    this.useMockForTimeLogs = useMock;
  }

  setUseMockForUsers(useMock: boolean): void {
    this.useMockForUsers = useMock;
  }

  /**
   * Get current API URL
   */
  getApiUrl(): string {
    return this.apiUrl;
  }
}
