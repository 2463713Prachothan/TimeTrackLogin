import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, map } from 'rxjs';
import { of } from 'rxjs';
import { UserService } from './user.service';

export interface PendingRegistration {
  registrationId?: number;
  name: string;
  email: string;
  passwordHash?: string;
  password?: string;
  role: 'Employee' | 'Manager';
  department: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedDate?: string;
  processedDate?: string;
  processedByUserId?: number;
  rejectionReason?: string;
  // Aliases for frontend compatibility
  id?: number | string;
  fullName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private userService = inject(UserService);

  // Use relative URL - requests will be proxied to backend via proxy.conf.json
  private readonly API_URL = '/api/Registration';

  // Helper to check if running in browser
  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private pendingRegistrations: PendingRegistration[] = [];
  private pendingSubject = new BehaviorSubject<PendingRegistration[]>([]);
  pending$ = this.pendingSubject.asObservable();

  constructor() {
    // Only load from backend in browser (SSR can't make API calls to self-signed certs)
    if (this.isBrowser) {
      this.loadPendingRegistrations();
    }
  }

  /**
   * Add a new pending registration by sending to backend
   * Endpoint: POST api/Registration (or wherever your backend expects new registrations)
   */
  addPendingRegistration(userData: any): Observable<any> {
    // Map to database field names
    const registration = {
      name: userData.fullName || userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      department: userData.department
    };

    console.log('📝 RegistrationService.addPendingRegistration - Sending to backend:', registration);
    // Try registering through the Registration API
    return this.http.post(`${this.API_URL}`, registration).pipe(
      tap((response: any) => {
        console.log('✅ RegistrationService - Registration sent to backend for approval');
      }),
      catchError((error: any) => {
        console.error('❌ RegistrationService - Error sending registration:', error);
        // Fallback to localStorage if backend fails
        const regData: PendingRegistration = {
          name: registration.name,
          email: registration.email,
          role: registration.role as 'Employee' | 'Manager',
          department: registration.department,
          status: 'Pending',
          appliedDate: new Date().toISOString()
        };
        this.pendingRegistrations.push(regData);
        this.savePendingToStorage();
        this.pendingSubject.next([...this.pendingRegistrations]);
        return of({ success: false, message: 'Sent to local storage as backup' });
      })
    );
  }

  /**
   * Get all pending registrations from backend
   * GET api/Registration/pending
   */
  getPendingRegistrations(): Observable<PendingRegistration[]> {
    // Only make API calls in browser (SSR has certificate issues)
    if (!this.isBrowser) {
      console.log('⏭️ RegistrationService - Skipping API call (SSR)');
      return of([]);
    }
    
    const url = `${this.API_URL}/pending`;
    console.log('📡 RegistrationService - Fetching from:', url);
    
    return this.http.get<any>(url).pipe(
      map((response: any) => {
        console.log('✅ RegistrationService - Raw response from backend:', response);
        console.log('✅ RegistrationService - Response type:', typeof response);
        console.log('✅ RegistrationService - Is Array:', Array.isArray(response));
        
        // Handle different response formats from backend
        let registrations: PendingRegistration[] = [];
        
        if (Array.isArray(response)) {
          registrations = response;
        } else if (response && Array.isArray(response.data)) {
          registrations = response.data;
        } else if (response && Array.isArray(response.result)) {
          registrations = response.result;
        } else if (response && Array.isArray(response.$values)) {
          // Handle .NET serialization format
          registrations = response.$values;
        } else if (response && typeof response === 'object') {
          // Try to find an array property
          const keys = Object.keys(response);
          for (const key of keys) {
            if (Array.isArray(response[key])) {
              registrations = response[key];
              console.log(`✅ Found array in response.${key}`);
              break;
            }
          }
        }
        
        console.log('✅ RegistrationService - Parsed registrations:', registrations);
        console.log('✅ RegistrationService - Count:', registrations.length);
        
        this.pendingRegistrations = registrations;
        this.pendingSubject.next([...this.pendingRegistrations]);
        
        return registrations;
      }),
      catchError((error: any) => {
        console.error('❌ RegistrationService - Error loading from backend:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ StatusText:', error.statusText);
        console.error('❌ URL:', error.url);
        console.error('❌ Error body:', error.error);
        this.loadPendingFromStorage();
        return of([]);
      })
    );
  }

  /**
   * Get all approved registrations from backend
   * GET api/Registration/approved
   */
  getApprovedRegistrations(): Observable<PendingRegistration[]> {
    return this.http.get<PendingRegistration[]>(`${this.API_URL}/approved`).pipe(
      tap((registrations: PendingRegistration[]) => {
        console.log('✅ RegistrationService - Loaded approved registrations from backend:', registrations.length);
      }),
      catchError((error: any) => {
        console.error('❌ RegistrationService - Error loading approved registrations:', error);
        return of([]);
      })
    );
  }

  /**
   * Get all rejected registrations from backend
   * GET api/Registration/rejected
   */
  getRejectedRegistrations(): Observable<PendingRegistration[]> {
    return this.http.get<PendingRegistration[]>(`${this.API_URL}/rejected`).pipe(
      tap((registrations: PendingRegistration[]) => {
        console.log('✅ RegistrationService - Loaded rejected registrations from backend:', registrations.length);
      }),
      catchError((error: any) => {
        console.error('❌ RegistrationService - Error loading rejected registrations:', error);
        return of([]);
      })
    );
  }

  /**
   * Get pending registrations count from backend
   * GET api/Registration/pending/count
   */
  getPendingCountFromApi(): Observable<number> {
    return this.http.get<number>(`${this.API_URL}/pending/count`).pipe(
      tap((count: number) => {
        console.log('✅ RegistrationService - Pending count from backend:', count);
      }),
      catchError((error: any) => {
        console.error('❌ RegistrationService - Error getting pending count:', error);
        return of(0);
      })
    );
  }

  /**
   * Approve a registration via backend
   * POST api/Registration/{id}/approve
   * Also adds the user to localStorage for admin user management (since /api/User doesn't exist)
   */
  approveRegistration(id: string, approvedBy: string = 'Admin', registrationData?: PendingRegistration): Observable<any> {
    console.log('✅ RegistrationService.approveRegistration - Approving registration:', id);
    return this.http.post(`${this.API_URL}/${id}/approve`, { approvedBy }).pipe(
      tap((response: any) => {
        console.log('✅ RegistrationService - Registration approved by backend');
        
        // Add approved user to localStorage (since /api/User endpoint doesn't exist)
        if (registrationData) {
          const newUser = {
            id: `user_${Date.now()}`,
            email: registrationData.email,
            fullName: registrationData.name || registrationData.fullName || registrationData.email,
            role: registrationData.role as 'Employee' | 'Manager',
            department: registrationData.department,
            status: 'Active' as const,
            createdDate: new Date(),
            joinDate: new Date().toISOString()
          };
          console.log('✅ RegistrationService - Adding approved user to localStorage:', newUser);
          this.userService.addUser(newUser);
        }
        
        // Refresh pending list
        this.loadPendingRegistrations();
      }),
      catchError((error: any) => {
        console.error('❌ RegistrationService - Error approving registration:', error);
        return of({ success: false, message: 'Error approving registration' });
      })
    );
  }

  /**
   * Reject a registration via backend
   * POST api/Registration/{id}/reject
   */
  rejectRegistration(id: string, reason?: string): Observable<any> {
    console.log('❌ RegistrationService.rejectRegistration - Rejecting registration:', id);
    return this.http.post(`${this.API_URL}/${id}/reject`, { reason }).pipe(
      tap((response: any) => {
        console.log('✅ RegistrationService - Registration rejected by backend');
        // Refresh pending list
        this.loadPendingRegistrations();
      }),
      catchError((error: any) => {
        console.error('❌ RegistrationService - Error rejecting registration:', error);
        return of({ success: false, message: 'Error rejecting registration' });
      })
    );
  }

  /**
   * Delete a registration via backend
   * DELETE api/Registration/{id}
   */
  deleteRegistrationFromApi(id: string): Observable<any> {
    console.log('🗑️ RegistrationService.deleteRegistration - Deleting registration:', id);
    return this.http.delete(`${this.API_URL}/${id}`).pipe(
      tap((response: any) => {
        console.log('✅ RegistrationService - Registration deleted from backend');
        // Refresh pending list
        this.loadPendingRegistrations();
      }),
      catchError((error: any) => {
        console.error('❌ RegistrationService - Error deleting registration:', error);
        return of({ success: false, message: 'Error deleting registration' });
      })
    );
  }

  /**
   * Get pending registrations count
   */
  getPendingCount(): number {
    return this.pendingRegistrations.filter(r => r.status === 'Pending').length;
  }

  /**
   * Delete a registration (after approval/rejection)
   * Uses registrationId to match database schema
   */
  deleteRegistration(id: string | number): void {
    const index = this.pendingRegistrations.findIndex(r => 
      r.registrationId === id || r.id === id
    );
    if (index !== -1) {
      this.pendingRegistrations.splice(index, 1);
      this.savePendingToStorage();
      this.pendingSubject.next([...this.pendingRegistrations]);
    }
  }

  /**
   * Load pending registrations from backend on init
   */
  private loadPendingRegistrations(): void {
    this.getPendingRegistrations().subscribe({
      next: (registrations: PendingRegistration[]) => {
        console.log('✅ Pending registrations loaded from backend');
      },
      error: (err) => {
        console.warn('⚠️ Failed to load from backend, loading from localStorage');
        this.loadPendingFromStorage();
      }
    });
  }

  /**
   * Save pending registrations to localStorage (as backup)
   */
  private savePendingToStorage() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('pendingRegistrations', JSON.stringify(this.pendingRegistrations));
    }
  }

  /**
   * Load pending registrations from localStorage (fallback)
   */
  private loadPendingFromStorage() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('pendingRegistrations');
      if (saved) {
        try {
          this.pendingRegistrations = JSON.parse(saved);
          this.pendingSubject.next([...this.pendingRegistrations]);
          console.log('✅ Loaded pending registrations from localStorage:', this.pendingRegistrations.length);
        } catch (e) {
          console.error('Error loading pending registrations', e);
          this.pendingRegistrations = [];
        }
      }
    }
  }
}
