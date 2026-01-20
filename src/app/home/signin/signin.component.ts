import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
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
// signin.component.ts
onLogin() {
  if (this.signinForm.valid) {
    const email = this.signinForm.value.email.toLowerCase();
    const selectedRole = this.signinForm.value.role;
    const enteredpassword = this.signinForm.value.password;
    
    const loginSuccess = this.authService.login(email, enteredpassword);

    if (loginSuccess) {
      const user = this.authService.currentUser();

      // 1. First, check if the role matches
      if (selectedRole !== user.role) {
        alert(`Access Denied: You are registered as ${user.role}, not ${selectedRole}.`);
        this.authService.logout();
        return;
      }

      // 2. If it matches, determine the name to display
      // Use user.name if available, otherwise the email prefix
      const displayName = user.name ? user.name : email.split('@')[0];

      // 3. Update the ManagerDataService once with the correct name
      this.managerDataService.setUser(displayName, user.role);

      alert('Login Successful!');
      
      // 4. Finally, navigate to the dashboard
      this.authService.navigateToDashboard(user.role);
    } else {
      alert('Invalid email or password.');
    }
  }
}
}