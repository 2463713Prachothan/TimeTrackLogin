import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({ 
  selector: 'app-singin',
  imports: [],
  templateUrl: './singin.component.html',
  styleUrl: './singin.component.css'
 })
export class SinginComponent {
  private router = inject(Router);
  loginForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onLogin() {
    if (this.loginForm.valid) {
      // In a real app, this data comes from your API/Service
      const userRole = this.getUserRoleFromDatabase(); 

      // Redirect to respective role dashboard
      if (userRole === 'Admin') {
        this.router.navigate(['/roles/admin/dashboard']);
      } else if (userRole === 'Manager') {
        this.router.navigate(['/roles/manager/dashboard']);
      } else {
        this.router.navigate(['/roles/employee/dashboard']);
      }
    }
  }

  private getUserRoleFromDatabase() {
    // For testing, return 'Admin' or 'Employee'
    return 'Admin'; 
  }
}