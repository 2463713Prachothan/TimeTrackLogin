import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { RegistrationService } from './registration.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private registrationService = inject(RegistrationService);

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
   * Main Login Logic: Checks Admin first, then LocalStorage users.
   */
  login(email: string, password: string): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;

    const emailLower = email.toLowerCase();

    // A. Check Hardcoded Admin
    if (emailLower === this.ADMIN_USER.email && password === this.ADMIN_USER.password) {
      this.currentUser.set({ ...this.ADMIN_USER, id: 'admin' });
      this.saveToStorage({ ...this.ADMIN_USER, id: 'admin' });
      console.log('✅ AuthService.login - Admin login successful');
      return true;
    }

    // B. Check Registered Users in localStorage
    const usersJson = localStorage.getItem('users');
    
    if (usersJson) {
      const users: any[] = JSON.parse(usersJson);
      console.log('🔍 AuthService.login - Checking', users.length, 'users for email:', emailLower);
      
      const foundUser = users.find(u => {
        const emailMatch = u.email.toLowerCase() === emailLower;
        const passwordMatch = u.password === password;
        if (emailMatch) {
          console.log(`   Found user "${u.fullName}" with email ${u.email} - Password match: ${passwordMatch}`);
        }
        return emailMatch && passwordMatch;
      });
      
      if (foundUser) {
        // Construct fullName from available data
        let fullName = foundUser.fullName;
        if (!fullName) {
          // Fallback: combine firstName and lastName if they exist
          const firstName = foundUser.firstName || '';
          const lastName = foundUser.lastName || '';
          fullName = `${firstName} ${lastName}`.trim() || foundUser.email;
        }
        
        const userToSet = {
          ...foundUser,
          fullName: fullName,
          id: foundUser.id // Ensure ID is included
        };
        this.currentUser.set(userToSet);
        this.saveToStorage(userToSet);
        console.log('✅ AuthService.login - User login successful:', { fullName: fullName, email: foundUser.email });
        return true;
      } else {
        console.log('❌ AuthService.login - No matching user found or password incorrect');
      }
    } else {
      console.warn('⚠️ AuthService.login - No users found in localStorage');
    }
    return false;
  }



    // B. Check Registered Users in localStorage
   
  /**
   * Registers a new user as pending approval.
   * Does NOT allow Admin registration.
   */
  register(userData: any) {
    if (isPlatformBrowser(this.platformId)) {
      // Add to pending registrations for admin approval
      this.registrationService.addPendingRegistration(userData);
      
      // Show message and redirect to signin
      alert('Your registration has been submitted for approval. Please wait for admin to approve your account.');
      this.router.navigate(['/signin']);
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
      this.router.navigate(['/admin/users']);
    } else if (r === 'employee') {
      this.router.navigate(['/employee/loghours']);
    } else {
      this.router.navigate(['/manager/team-logs']);
    }
  }

  logout() {
    // Clear timer session when logging out
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('timerSession');
    }
    
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
    