import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserService } from './user.service';

export interface PendingRegistration {
  id?: string;
  email: string;
  fullName: string;
  role: 'Employee' | 'Manager';
  department: string;
  password: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedDate?: string;
  approvedDate?: string;
  approvedBy?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {
  private platformId = inject(PLATFORM_ID);
  private userService = inject(UserService);

  private pendingRegistrations: PendingRegistration[] = [];
  private pendingSubject = new BehaviorSubject<PendingRegistration[]>([]);
  pending$ = this.pendingSubject.asObservable();

  constructor() {
    this.loadPendingFromStorage();
  }

  /**
   * Add a new pending registration
   */
  addPendingRegistration(userData: any): string {
    const registration: PendingRegistration = {
      id: `reg_${Date.now()}`,
      email: userData.email,
      fullName: userData.fullName,
      role: userData.role,
      department: userData.department,
      password: userData.password,
      status: 'Pending',
      appliedDate: new Date().toLocaleString()
    };

    this.pendingRegistrations.push(registration);
    this.savePendingToStorage();
    this.pendingSubject.next([...this.pendingRegistrations]);
    return registration.id || '';
  }

  /**
   * Get all pending registrations
   */
  getPendingRegistrations(): Observable<PendingRegistration[]> {
    return this.pending$;
  }

  /**
   * Approve a registration and move to active users
   */
  approveRegistration(id: string, approvedBy: string = 'Admin'): boolean {
    const index = this.pendingRegistrations.findIndex(r => r.id === id);
    if (index === -1) return false;

    const registration = this.pendingRegistrations[index];
    registration.status = 'Approved';
    registration.approvedDate = new Date().toLocaleString();
    registration.approvedBy = approvedBy;

    // Add to active users via UserService
    this.userService.addUser({
      fullName: registration.fullName,
      email: registration.email,
      role: registration.role,
      department: registration.department,
      password: registration.password,
      status: 'Active'
    });

    this.savePendingToStorage();
    this.pendingSubject.next([...this.pendingRegistrations]);
    return true;
  }

  /**
   * Reject a registration
   */
  rejectRegistration(id: string, reason?: string): boolean {
    const index = this.pendingRegistrations.findIndex(r => r.id === id);
    if (index === -1) return false;

    const registration = this.pendingRegistrations[index];
    registration.status = 'Rejected';

    this.savePendingToStorage();
    this.pendingSubject.next([...this.pendingRegistrations]);
    return true;
  }

  /**
   * Get pending registrations count
   */
  getPendingCount(): number {
    return this.pendingRegistrations.filter(r => r.status === 'Pending').length;
  }

  /**
   * Delete a registration (after approval/rejection)
   */
  deleteRegistration(id: string): boolean {
    const index = this.pendingRegistrations.findIndex(r => r.id === id);
    if (index === -1) return false;

    this.pendingRegistrations.splice(index, 1);
    this.savePendingToStorage();
    this.pendingSubject.next([...this.pendingRegistrations]);
    return true;
  }

  /**
   * Save pending registrations to localStorage
   */
  private savePendingToStorage() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('pendingRegistrations', JSON.stringify(this.pendingRegistrations));
    }
  }

  /**
   * Load pending registrations from localStorage
   */
  private loadPendingFromStorage() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('pendingRegistrations');
      if (saved) {
        try {
          this.pendingRegistrations = JSON.parse(saved);
          this.pendingSubject.next([...this.pendingRegistrations]);
        } catch (e) {
          console.error('Error loading pending registrations', e);
          this.pendingRegistrations = [];
        }
      }
    }
  }
}
