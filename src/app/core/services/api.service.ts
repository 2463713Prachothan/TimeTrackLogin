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
      // Try multiple token storage locations
      let token = localStorage.getItem('token');

      // Fallback: check if token is in user_session
      if (!token) {
        try {
          const userSession = localStorage.getItem('user_session');
          if (userSession) {
            const user = JSON.parse(userSession);
            token = user.token || user.accessToken || user.jwtToken;
          }
        } catch (e) {
          console.error('Error parsing user session:', e);
        }
      }

      if (token) {
        console.log('✅ ApiService.getHeaders - Token found, adding Authorization header');
        headers = headers.set('Authorization', `Bearer ${token}`);
      } else {
        console.warn('⚠️ ApiService.getHeaders - No token found in localStorage');
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
   * Get team members for the current manager
   * Backend endpoint: GET /api/User/my-team
   */
  getMyTeam(): Observable<any[]> {
    if (!isPlatformBrowser(this.platformId)) {
      return of([]);
    }

    console.log('📡 ApiService - Fetching my team from:', `${this.apiUrl}/User/my-team`);

    return this.http.get<any>(`${this.apiUrl}/User/my-team`, { headers: this.getHeaders() })
      .pipe(
        tap((response: any) => {
          console.log('📥 ApiService - My team raw response:', response);
        }),
        map((response: any) => {
          // Handle different response formats
          let members: any[] = [];
          if (Array.isArray(response)) {
            members = response;
          } else if (response && Array.isArray(response.$values)) {
            members = response.$values;
          } else if (response && Array.isArray(response.data)) {
            members = response.data;
          }
          console.log('✅ ApiService - Parsed team members:', members);
          return members;
        }),
        catchError(err => {
          console.error('❌ ApiService - Error fetching my team:', err);
          return of([]);
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
   * Get all time logs for current user
   * Backend endpoint: GET /api/TimeLog/user
   */
  getTimeLogs(startDate?: string, endDate?: string): Observable<any[]> {
    if (this.useMockForTimeLogs) {
      return of([]);
    }

    let url = `${this.apiUrl}/TimeLog/user`;
    const params: string[] = [];

    if (startDate) params.push(`startDate=${encodeURIComponent(startDate)}`);
    if (endDate) params.push(`endDate=${encodeURIComponent(endDate)}`);

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    console.log('📡 ApiService - Fetching time logs from:', url);
    return this.http.get<any>(`${url}`, { headers: this.getHeaders() })
      .pipe(
        tap((response: any) => {
          console.log('📥 ApiService - Time logs response:', response);
        }),
        map((response: any) => {
          // Handle ApiResponseDto wrapper
          if (response?.data) {
            return Array.isArray(response.data) ? response.data : [response.data];
          }
          return Array.isArray(response) ? response : [];
        }),
        catchError(err => {
          console.error('❌ ApiService - Error fetching time logs:', err);
          return of([]);
        })
      );
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
  createTimeLog(data: any): Observable<any> {
    if (this.useMockForTimeLogs) {
      return of({ ...data, id: `log_${Date.now()}` });
    }

    console.log('📡 ApiService - Creating time log:', data);
    return this.http.post<any>(`${this.apiUrl}/TimeLog`, data, { headers: this.getHeaders() })
      .pipe(
        tap((response: any) => {
          console.log('✅ ApiService - Time log created:', response);
        }),
        map((response: any) => {
          // Handle ApiResponseDto wrapper
          if (response?.data) {
            return response.data;
          }
          return response;
        }),
        catchError(err => {
          console.error('❌ ApiService - Error creating time log:', err);
          return this.handleError(err);
        })
      );
  }

  /**
   * Update time log
   * Backend endpoint: PUT /api/TimeLog/:id
   */
  updateTimeLog(id: string, data: any): Observable<any> {
    if (this.useMockForTimeLogs) {
      return of(data);
    }

    console.log(`📡 ApiService - Updating time log ${id}:`, data);
    return this.http.put<any>(`${this.apiUrl}/TimeLog/${id}`, data, { headers: this.getHeaders() })
      .pipe(
        tap((response: any) => {
          console.log('✅ ApiService - Time log updated:', response);
        }),
        map((response: any) => {
          // Handle ApiResponseDto wrapper
          if (response?.data) {
            return response.data;
          }
          return response;
        }),
        catchError(err => {
          console.error(`❌ ApiService - Error updating time log ${id}:`, err);
          return this.handleError(err);
        })
      );
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
   * Get tasks created by the current manager
   * Backend endpoint: GET /api/Task/created-by-me
   */
  getTasksCreatedByMe(): Observable<any[]> {
    if (!isPlatformBrowser(this.platformId)) {
      return of([]);
    }
    return this.http.get<any[]>(`${this.apiUrl}/Task/created-by-me`, { headers: this.getHeaders() })
      .pipe(
        tap((response: any) => {
          console.log('✅ ApiService - Tasks created by me:', response);
        }),
        map((response: any) => {
          // Handle different response formats
          let tasks: any[] = [];
          if (Array.isArray(response)) {
            tasks = response;
          } else if (response && Array.isArray(response.$values)) {
            tasks = response.$values;
          } else if (response && Array.isArray(response.data)) {
            tasks = response.data;
          }
          // Convert date strings to Date objects
          return tasks.map(task => ({
            ...task,
            dueDate: task.dueDate ? new Date(task.dueDate) : null,
            createdDate: task.createdDate ? new Date(task.createdDate) : null
          }));
        }),
        catchError(err => {
          console.error('❌ ApiService - Error fetching tasks created by me:', err);
          return of([]);
        })
      );
  }

  /**
   * Get tasks assigned to the current user (employee)
   * Backend endpoint: GET /api/Task/my-tasks
   */
  getMyTasks(): Observable<any[]> {
    if (!isPlatformBrowser(this.platformId)) {
      return of([]);
    }

    console.log('📡 ApiService - Fetching my tasks from:', `${this.apiUrl}/Task/my-tasks`);

    return this.http.get<any>(`${this.apiUrl}/Task/my-tasks`, { headers: this.getHeaders() })
      .pipe(
        tap((response: any) => {
          console.log('📥 ApiService - My tasks raw response:', response);
        }),
        map((response: any) => {
          // Handle different response formats
          let tasks: any[] = [];
          if (Array.isArray(response)) {
            tasks = response;
          } else if (response && Array.isArray(response.$values)) {
            tasks = response.$values;
          } else if (response && Array.isArray(response.data)) {
            tasks = response.data;
          }
          // Convert date strings to Date objects
          return tasks.map(task => ({
            ...task,
            dueDate: task.dueDate ? new Date(task.dueDate) : null,
            createdDate: task.createdDate ? new Date(task.createdDate) : null
          }));
        }),
        catchError(err => {
          console.error('❌ ApiService - Error fetching my tasks:', err);
          return of([]);
        })
      );
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

  /**
   * Start a task (change status to 'In Progress')
   * Backend endpoint: PATCH /api/Task/{id}/start
   */
  startTask(id: string): Observable<any> {
    if (this.useMockForTasks) {
      return of({ success: true, status: 'InProgress' });
    }
    const url = `${this.apiUrl}/Task/${id}/start`;

    console.log('📡 ApiService.startTask - Making PATCH request to:', url);

    return this.http.patch<any>(url, {}, { headers: this.getHeaders() })
      .pipe(
        tap((response: any) => {
          console.log('✅ ApiService - Task started:', response);
        }),
        catchError(err => {
          console.error('❌ ApiService - Error starting task:', err);
          return this.handleError(err);
        })
      );
  }

  /**
   * Complete a task (change status to 'Completed')
   * Backend endpoint: PATCH /api/Task/{id}/complete
   */
  completeTask(id: string, hoursSpent: number = 0, comments: string = ''): Observable<any> {
    if (this.useMockForTasks) {
      return of({ success: true, status: 'Completed' });
    }
    const url = `${this.apiUrl}/Task/${id}/complete`;

    console.log('📡 ApiService.completeTask - Making PATCH request to:', url);

    return this.http.patch<any>(url, {}, { headers: this.getHeaders() })
      .pipe(
        tap((response: any) => {
          console.log('✅ ApiService - Task completed:', response);
        }),
        catchError(err => {
          console.error('❌ ApiService - Error completing task:', err);
          return this.handleError(err);
        })
      );
  }

  /**
   * Approve a task completion (manager action)
   * Backend endpoint: PATCH /api/Task/{id}/approve
   */
  approveTaskCompletion(id: string, approvalComments: string = ''): Observable<any> {
    if (this.useMockForTasks) {
      return of({ success: true, status: 'Approved' });
    }
    const url = `${this.apiUrl}/Task/${id}/approve`;

    return this.http.patch<any>(url, {}, { headers: this.getHeaders() })
      .pipe(
        tap((response: any) => {
          console.log('✅ ApiService - Task approved:', response);
        }),
        catchError(err => {
          console.error('❌ ApiService - Error approving task:', err);
          return this.handleError(err);
        })
      );
  }

  /**
   * Reject a task completion (manager action)
   * Backend endpoint: PATCH /api/Task/{id}/reject
   */
  rejectTask(id: string, reason: string): Observable<any> {
    const url = `${this.apiUrl}/Task/${id}/reject`;
    const payload = { reason };

    console.log('📡 ApiService.rejectTask - Making PATCH request to:', url);

    return this.http.patch<any>(url, payload, { headers: this.getHeaders() })
      .pipe(
        tap((response: any) => {
          console.log('✅ ApiService - Task rejected:', response);
        }),
        catchError(err => {
          console.error('❌ ApiService - Error rejecting task:', err);
          return this.handleError(err);
        })
      );
  }

  /**
   * Log time spent on a task
   * Backend endpoint: POST /api/Task/log-time
   */
  logTaskTime(dto: any): Observable<any> {
    const url = `${this.apiUrl}/Task/log-time`;

    console.log('📡 ApiService.logTaskTime - Making POST request to:', url);

    return this.http.post<any>(url, dto, { headers: this.getHeaders() })
      .pipe(
        tap((response: any) => {
          console.log('✅ ApiService - Time logged:', response);
        }),
        catchError(err => {
          console.error('❌ ApiService - Error logging time:', err);
          return this.handleError(err);
        })
      );
  }

  /**
   * Get tasks pending approval (manager only)
   * Backend endpoint: GET /api/Task/pending-approval
   */
  getPendingApprovalTasks(): Observable<any> {
    const url = `${this.apiUrl}/Task/pending-approval`;

    return this.http.get<any>(url, { headers: this.getHeaders() })
      .pipe(
        map((response: any) => {
          // Extract tasks from response
          const tasks = Array.isArray(response) ? response :
            (response?.data || response?.$values || []);
          return tasks;
        }),
        tap((tasks: any) => {
          console.log('✅ ApiService - Pending approval tasks:', tasks);
        }),
        catchError(err => {
          console.error('❌ ApiService - Error getting pending tasks:', err);
          return this.handleError(err);
        })
      );
  }

  /**
   * Get overdue tasks (manager only)
   * Backend endpoint: GET /api/Task/overdue
   */
  getOverdueTasks(): Observable<any> {
    const url = `${this.apiUrl}/Task/overdue`;

    return this.http.get<any>(url, { headers: this.getHeaders() })
      .pipe(
        map((response: any) => {
          // Extract tasks from response
          const tasks = Array.isArray(response) ? response :
            (response?.data || response?.$values || []);
          return tasks;
        }),
        tap((tasks: any) => {
          console.log('✅ ApiService - Overdue tasks:', tasks);
        }),
        catchError(err => {
          console.error('❌ ApiService - Error getting overdue tasks:', err);
          return this.handleError(err);
        })
      );
  }

  // ==================== REGISTRATION ENDPOINTS ====================
  // Note: Registration endpoints are now handled directly by RegistrationService
  // using /api/Registration endpoints

  // ==================== CONFIGURATION ====================

  /**
   * Get manager dashboard statistics
   * Backend endpoint: GET /api/Task/manager-stats?managerId={id}
   */
  getManagerStats(managerId: string): Observable<any> {
    if (!managerId) {
      console.warn('⚠️ ApiService.getManagerStats - No managerId provided');
      return of(null);
    }

    const url = `${this.apiUrl}/Task/manager-stats?managerId=${encodeURIComponent(managerId)}`;
    console.log('📡 ApiService.getManagerStats - Making GET request to:', url);

    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      tap(response => {
        console.log('✅ ApiService.getManagerStats - Response received:', response);
      }),
      catchError(err => {
        console.error('❌ ApiService.getManagerStats - Error:', err);
        return of(null);
      })
    );
  }

  /**
   * Get employee dashboard statistics
   * Backend endpoint: GET /api/Task/employee-stats?employeeId={id}
   */
  getEmployeeStats(employeeId: string): Observable<any> {
    if (!employeeId) {
      console.warn('⚠️ ApiService.getEmployeeStats - No employeeId provided');
      return of(null);
    }

    const url = `${this.apiUrl}/Task/employee-stats?employeeId=${encodeURIComponent(employeeId)}`;
    console.log('📡 ApiService.getEmployeeStats - Making GET request to:', url);

    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      tap(response => {
        console.log('✅ ApiService.getEmployeeStats - Response received:', response);
      }),
      catchError(err => {
        console.error('❌ ApiService.getEmployeeStats - Error:', err);
        return of(null);
      })
    );
  }

  /**
   * Get time logs for a specific task
   * Backend endpoint: GET /api/Task/{taskId}/time-logs
   */
  getTaskTimeLogs(taskId: string): Observable<any> {
    const url = `${this.apiUrl}/Task/${taskId}/time-logs`;
    console.log('📡 ApiService.getTaskTimeLogs - Making GET request to:', url);

    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      tap(response => {
        console.log('✅ ApiService.getTaskTimeLogs - Response received:', response);
      }),
      catchError(err => {
        console.error('❌ ApiService.getTaskTimeLogs - Error:', err);
        return of([]);
      })
    );
  }

  /**
   * Get tasks filtered by status
   * Backend endpoint: GET /api/Task?status={status}
   */
  getTasksByStatus(status: string): Observable<any> {
    const url = `${this.apiUrl}/Task?status=${status}`;
    console.log('📡 ApiService.getTasksByStatus - Making GET request to:', url);

    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      tap(response => {
        console.log('✅ ApiService.getTasksByStatus - Response received:', response);
      }),
      catchError(err => {
        console.error('❌ ApiService.getTasksByStatus - Error:', err);
        return of([]);
      })
    );
  }

  /**
   * Get tasks filtered by assigned employee (manager only)
   * Backend endpoint: GET /api/Task?assignedToUserId={userId}
   */
  getTasksByEmployee(employeeId: string): Observable<any> {
    const url = `${this.apiUrl}/Task?assignedToUserId=${employeeId}`;
    console.log('📡 ApiService.getTasksByEmployee - Making GET request to:', url);

    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      tap(response => {
        console.log('✅ ApiService.getTasksByEmployee - Response received:', response);
      }),
      catchError(err => {
        console.error('❌ ApiService.getTasksByEmployee - Error:', err);
        return of([]);
      })
    );
  }

  /**
   * Get productivity data for current employee
   */
  getProductivity(): Observable<any> {
    const url = `${this.apiUrl}/Productivity`;
    console.log('📡 ApiService.getProductivity - Making GET request to:', url);

    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      tap(response => {
        console.log('✅ ApiService.getProductivity - Response received:', response);
      }),
      catchError(err => {
        console.error('❌ ApiService.getProductivity - Error fetching productivity data:', err);
        console.error('Error details:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          url: err.url
        });
        throw err;
      })
    );
  }

  /**
   * Get productivity data for specific employee by ID
   */
  getEmployeeProductivity(employeeId: string): Observable<any> {
    const url = `${this.apiUrl}/Productivity/${employeeId}`;
    console.log('📡 ApiService.getEmployeeProductivity - Making GET request to:', url);

    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      tap(response => {
        console.log('✅ ApiService.getEmployeeProductivity - Response received:', response);
      }),
      catchError(err => {
        console.error('❌ ApiService.getEmployeeProductivity - Error fetching productivity data:', err);
        console.error('Error details:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          url: err.url
        });
        throw err;
      })
    );
  }

  // ==================== ORGANIZATION ANALYTICS ENDPOINTS ====================

  /**
   * Get organization-wide analytics summary
   * Backend endpoint: GET /api/Analytics/organization-summary
   */
  getOrganizationAnalytics(period: 7 | 14 | 30 | 90 = 7): Observable<any> {
    console.log(`📡 ApiService - Fetching organization analytics with period: ${period}`);

    if (!isPlatformBrowser(this.platformId)) {
      console.log('⚠️ ApiService - Skipping getOrganizationAnalytics in SSR');
      return of({
        statusCode: 200,
        data: {
          totalHoursLogged: 0,
          avgHoursPerEmployee: 0,
          activeEmployees: 0,
          totalEmployees: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          pendingTasks: 0,
          taskCompletionPercentage: 0,
          employeeCount: 0,
          managerCount: 0,
          adminCount: 0,
          departmentMetrics: [],
          avgEmployeesPerDepartment: 0,
          hoursTrendData: [],
          reportGeneratedAt: new Date().toISOString(),
          periodRange: `Last ${period} days`
        }
      });
    }

    return this.http.get<any>(
      `${this.apiUrl}/Analytics/organization-summary`,
      {
        params: { period },
        headers: this.getHeaders()
      }
    ).pipe(
      tap((response: any) => {
        console.log('✅ ApiService - Organization analytics response:', response);
      }),
      catchError((err: any) => {
        console.error('❌ ApiService - Error fetching organization analytics:', err);
        return this.handleError(err);
      })
    );
  }

  /**
   * Get department-specific analytics
   * Backend endpoint: GET /api/Analytics/department/{departmentName}
   */
  getDepartmentAnalytics(departmentName: string, startDate?: string, endDate?: string): Observable<any> {
    console.log(`📡 ApiService - Fetching analytics for department: ${departmentName}`);

    if (!isPlatformBrowser(this.platformId)) {
      return of({
        statusCode: 200,
        data: {
          departmentName,
          employeeCount: 0,
          totalHours: 0,
          avgHoursPerEmployee: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          pendingTasks: 0,
          employeeIds: []
        }
      });
    }

    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return this.http.get<any>(
      `${this.apiUrl}/Analytics/department/${encodeURIComponent(departmentName)}`,
      {
        params,
        headers: this.getHeaders()
      }
    ).pipe(
      tap((response: any) => {
        console.log(`✅ ApiService - Department analytics for ${departmentName}:`, response);
      }),
      catchError((err: any) => {
        console.error(`❌ ApiService - Error fetching department analytics:`, err);
        return this.handleError(err);
      })
    );
  }

  /**
   * Get hours trend data for charts
   * Backend endpoint: GET /api/Analytics/hours-trend
   */
  getHoursTrend(days: 7 | 14 | 30 | 90 = 7): Observable<any> {
    console.log(`📡 ApiService - Fetching hours trend for ${days} days`);

    if (!isPlatformBrowser(this.platformId)) {
      return of({
        statusCode: 200,
        data: []
      });
    }

    return this.http.get<any>(
      `${this.apiUrl}/Analytics/hours-trend`,
      {
        params: { days },
        headers: this.getHeaders()
      }
    ).pipe(
      tap((response: any) => {
        console.log('✅ ApiService - Hours trend response:', response);
      }),
      catchError((err: any) => {
        console.error('❌ ApiService - Error fetching hours trend:', err);
        return this.handleError(err);
      })
    );
  }

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
   * Get task completion breakdown by status
   * Backend endpoint: GET /api/Analytics/task-completion-breakdown
   */
  getTaskCompletionBreakdown(startDate?: string, endDate?: string): Observable<any> {
    console.log('📡 ApiService - Fetching task completion breakdown');

    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    if (!isPlatformBrowser(this.platformId)) {
      console.log('⚠️ ApiService - Skipping getTaskCompletionBreakdown in SSR');
      return of({
        success: true,
        data: {
          completedCount: 0,
          inProgressCount: 0,
          pendingCount: 0,
          rejectedCount: 0,
          overdueCount: 0,
          totalCount: 0,
          completionPercentage: 0
        }
      });
    }

    return this.http.get<any>(
      `${this.apiUrl}/Analytics/task-completion-breakdown`,
      {
        params,
        headers: this.getHeaders()
      }
    ).pipe(
      tap((response: any) => {
        console.log('✅ ApiService - Task completion breakdown response:', response);
      }),
      catchError((err: any) => {
        console.error('❌ ApiService - Error fetching task completion breakdown:', err);
        return this.handleError(err);
      })
    );
  }

  /**
   * Get current API URL
   */
  getApiUrl(): string {
    return this.apiUrl;
  }
}
