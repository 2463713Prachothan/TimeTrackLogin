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

  // signin.component.ts
  onLogin() {
    if (this.signinForm.valid) {
      const email = this.signinForm.value.email.toLowerCase();
      const selectedRole = this.signinForm.value.role;
      const enteredPassword = this.signinForm.value.password;

      const loginSuccess = this.authService.login(email, enteredPassword);

      if (loginSuccess) {
        const user = this.authService.currentUser();

        // 1. First, check if the role matches
        if (selectedRole !== user.role) {
          this.notificationService.error(`Access Denied: You are registered as ${user.role}, not ${selectedRole}.`, 5000);
          // Delay logout to ensure notification is visible
          setTimeout(() => {
            this.authService.logout();
          }, 500);
          return;
        }

        // Get the actual user name
        const displayName = user.fullName || user.role;

        // Store user data for all roles
        if (user.role === 'Manager') {
          this.managerDataService.setUser(displayName, user.role);
        }

        // 2. Show soft notification and navigate immediately
        this.notificationService.success(`Welcome, ${displayName}!`);
        this.authService.navigateToDashboard(user.role);
      } else {
        this.notificationService.error('Invalid email or password.', 4000);
      }
    }
  }
  
}