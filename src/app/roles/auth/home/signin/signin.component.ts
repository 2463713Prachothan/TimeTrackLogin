import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
 
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
roles: string[] = ['Employee', 'Manager', 'Admin'];
private authService = inject(AuthService);
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
    const enteredpassword=this.signinForm.value.password;
    const loginSuccess = this.authService.login(email, enteredpassword);
 
    // Retrieve the role saved during registration
   // const registeredRole = localStorage.getItem(email);
    //const storedUserJson = localStorage.getItem(email);
    if (loginSuccess) {
        // 2. GET THE LOGGED IN USER FROM THE SIGNAL
        const user = this.authService.currentUser();
    if (selectedRole !== user.role) {
      alert(`Access Denied: You are registered as ${user.role}, not ${selectedRole}.`);
      this.authService.logout(); // Clear the session if they picked the wrong role
      return;
    }
   alert('Login Successful!');
   this.authService.navigateToDashboard(user.role);
  }
  else{
    alert('invalid email or password .');
  }

       
    }
  }
}