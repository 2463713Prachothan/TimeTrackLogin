import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);

  private readonly API_URL = 'https://localhost:7172/api/Auth';

  // 1. Hardcoded Admin Data (No registration needed)
  private readonly ADMIN_USER = {
    fullName: 'Administrator',
    email: 'admin@gmail.com',
    password: 'AdminPassword@123',
    role: 'Admin',
    department: null // Admin has no department
  };

  /**
   * currentUser signal holds the logged-in user's data.
   * Initialized as null.
   */
  currentUser = signal<any>(null);

  constructor() {
    // On initialization, check if a session exists in the browser's storage
    if (isPlatformBrowser(this.platformId)) {
      const savedUser = localStorage.getItem('user_session');
      if (savedUser) {
        // Use .set() to update a signal
        this.currentUser.set(JSON.parse(savedUser));
      }
    }
  }

  /**
   * Login via API. Returns an Observable with the server response.
   */
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.API_URL}/login`, { email, password });
  }

  /**
   * Sets the current user after a successful login response.
   */
  setCurrentUser(user: any) {
    this.currentUser.set(user);
    this.saveToStorage(user);
  }

  /**
   * Registers a new user and adds them to the local 'users' array.
   * Does NOT allow Admin registration.
   */
  register(userData: any): Observable<any> {
    return this.http.post(`${this.API_URL}/register`, userData);
  }

  private saveToStorage(user: any) {
    localStorage.setItem('user_session', JSON.stringify(user));
    localStorage.setItem('isLoggedIn', 'true');
  }

  /**
   * Role-based redirection logic
   */
  navigateToDashboard(role: string) {
    if (!role) return;
    const r = role.toLowerCase();

    if (r === 'admin') {
      this.router.navigate(['/admin']);
    } else if (r === 'employee') {
      this.router.navigate(['/employee/dashboardemployee']);
    } else {
      this.router.navigate(['/manager']);
    }
  }

  logout() {
    this.currentUser.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('user_session');
      localStorage.removeItem('isLoggedIn');
    }
    this.router.navigate(['/signin']);
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }
}
