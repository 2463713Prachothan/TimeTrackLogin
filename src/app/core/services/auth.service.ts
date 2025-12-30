import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  // 1. Hardcoded Admin Data (No registration needed)
  private readonly ADMIN_USER = {
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
   * Main Login Logic: Checks Admin first, then LocalStorage users.
   */
  login(email: string, password: string): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;

    const emailLower = email.toLowerCase();

    // A. Check Hardcoded Admin
    if (emailLower === this.ADMIN_USER.email && password === this.ADMIN_USER.password) {
      this.currentUser.set({ ...this.ADMIN_USER });
      this.saveToStorage(this.ADMIN_USER);
     // this.navigateToDashboard(this.ADMIN_USER.role);
      return true;
    }

    const usersJson = localStorage.getItem('users');
    
    if (usersJson) {
   const users: any[] = JSON.parse(usersJson);
    const foundUser = users.find(u => 
        u.email.toLowerCase() === emailLower && u.password === password
      );
      if (foundUser) {
        this.currentUser.set(foundUser);
        this.saveToStorage(foundUser);
        return true;
      }
    }
      return false;
  }



    // B. Check Registered Users in localStorage
   
  /**
   * Registers a new user and adds them to the local 'users' array.
   * Does NOT allow Admin registration.
   */
  register(userData: any) {
    if (isPlatformBrowser(this.platformId)) {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Save the new user to the "database"
      users.push(userData);
      localStorage.setItem('users', JSON.stringify(users));

      // Auto-login after registration
      this.currentUser.set(userData);
      this.saveToStorage(userData);
      this.navigateToDashboard(userData.role);
    }
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
      this.router.navigate(['/admin/dashboard']);
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
    