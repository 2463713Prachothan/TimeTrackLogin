import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface PendingRegistration {
  registrationId: number;
  id?: string;
  name: string;
  fullName?: string;
  email: string;
  role: 'Employee' | 'Manager';
  department: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedDate: string;
  processedDate?: string;
  processedByName?: string;
  rejectionReason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);

  private readonly API_URL = 'https://localhost:7172/api/Registration';

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (isPlatformBrowser(this.platformId)) {
      const userSession = localStorage.getItem('user_session');
      if (userSession) {
        try {
          const user = JSON.parse(userSession);
          if (user.token) {
            headers = headers.set('Authorization', `Bearer ${user.token}`);
          }
        } catch (e) {
          console.error('Error parsing user session:', e);
        }
      }
    }
    return headers;
  }

  /**
   * Get ALL registrations (pending + approved + rejected)
   */
  getAllRegistrations(): Observable<PendingRegistration[]> {
    return this.http.get<any>(`${this.API_URL}`, { headers: this.getHeaders() })
      .pipe(
        map(response => this.mapRegistrations(response.data || response || [])),
        catchError(err => {
          console.error('Error fetching all registrations:', err);
          return of([]);
        })
      );
  }

  /**
   * Get pending registrations only
   */
  getPendingRegistrations(): Observable<PendingRegistration[]> {
    return this.http.get<any>(`${this.API_URL}/pending`, { headers: this.getHeaders() })
      .pipe(
        map(response => this.mapRegistrations(response.data || response || [])),
        catchError(err => {
          console.error('Error fetching pending registrations:', err);
          return of([]);
        })
      );
  }

  /**
   * Get pending count
   */
  getPendingCount(): Observable<number> {
    return this.http.get<any>(`${this.API_URL}/pending/count`, { headers: this.getHeaders() })
      .pipe(
        map(response => response.data || 0),
        catchError(() => of(0))
      );
  }

  /**
   * Approve a registration
   */
  approveRegistration(registrationId: number | string): Observable<any> {
    const id = typeof registrationId === 'string' ? parseInt(registrationId, 10) : registrationId;
    return this.http.post<any>(
      `${this.API_URL}/${id}/approve`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Reject a registration
   */
  rejectRegistration(registrationId: number | string, reason?: string): Observable<any> {
    const id = typeof registrationId === 'string' ? parseInt(registrationId, 10) : registrationId;
    return this.http.post<any>(
      `${this.API_URL}/${id}/reject`,
      { registrationId: id, reason: reason || '' },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Delete a registration
   */
  deleteRegistration(registrationId: number | string): Observable<any> {
    const id = typeof registrationId === 'string' ? parseInt(registrationId, 10) : registrationId;
    return this.http.delete<any>(
      `${this.API_URL}/${id}`,
      { headers: this.getHeaders() }
    );
  }

  private mapRegistrations(data: any[]): PendingRegistration[] {
    return data.map(r => ({
      registrationId: r.registrationId,
      id: r.registrationId?.toString(),
      name: r.name,
      fullName: r.name,
      email: r.email,
      role: r.role,
      department: r.department,
      status: r.status,
      appliedDate: r.appliedDate,
      processedDate: r.processedDate,
      processedByName: r.processedByName,
      rejectionReason: r.rejectionReason
    }));
  }
}