import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ManagerDataService } from '../../core/services/manager-data.service';
 
@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private managerDataService = inject(ManagerDataService);
 
  roles: string[] = ['Employee', 'Manager', 'Admin'];
  signinForm: FormGroup;
 
  constructor() {
    this.signinForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      role: ['', [Validators.required]]
    });
  }
 
  // Helper for HTML access
  get f() { return this.signinForm.controls; }
 
  onLogin() {
    if (this.signinForm.valid) {
      const email = this.signinForm.value.email.toLowerCase();
      const selectedRole = this.signinForm.value.role;
      const enteredPassword = this.signinForm.value.password;

      // Call backend API for all users (including Admin)
      this.authService.loginAsync(email, enteredPassword).subscribe({
        next: (response: any) => {
          console.log('Login response:', response);
          // API returns { success, message, data: { userId, name, email, role, department, token, tokenExpiration } }
          let user = response.data || response;

          // Normalize user data - ensure fullName is set from either fullName or name
          if (!user.fullName && user.name) {
            user.fullName = user.name;
          }

          // Set the user in the auth service
          this.authService.setCurrentUser(user);

          // 1. First, check if the role matches
          if (selectedRole !== user.role) {
            this.notificationService.error(`Access Denied: You are registered as ${user.role}, not ${selectedRole}.`, 5000);
            setTimeout(() => {
              this.authService.logout();
            }, 500);
            return;
          }

          // Get the actual user name
          const displayName = user.name || user.fullName || user.role;

          // Store user data for all roles
          if (user.role === 'Manager') {
            this.managerDataService.setUser(displayName, user.role);
          }

          // 2. Show soft notification and navigate immediately
          this.notificationService.success(`Welcome, ${displayName}!`);
          this.authService.navigateToDashboard(user.role);
        },
        error: (err: any) => {
          console.error('Login failed:', err);
          const message = err.error?.message || err.error || 'Invalid email or password.';
          this.notificationService.error(message, 4000);
        }
      });
    }
  }
 
}
 