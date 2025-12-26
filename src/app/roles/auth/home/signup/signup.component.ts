import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
 
@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,RouterModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
 
  signupForm: FormGroup;
  showPassword = false;
 
  // Roles for the dropdown
  roles: string[] = ['Employee', 'Manager', 'Admin'];
 
  constructor() {
    this.signupForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['', [Validators.required]], // Dropdown selection
      password: ['', [
        Validators.required,
        // Rule: 8+ chars, 1 Upper, 1 Lower, 1 Number, 1 Symbol
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]]
    });
  }
 
  // Helper for easy access to form fields in HTML
  get f() { return this.signupForm.controls; }
 
  togglePassword() {
    this.showPassword = !this.showPassword;
  }
 
  onSubmit() {
    if (this.signupForm.valid) {
      console.log('User Data:', this.signupForm.value);
      alert(`Account created for ${this.signupForm.value.fullName} as ${this.signupForm.value.role}`);
      this.router.navigate(['/singin']); // Redirect to login after success
    }
  }
}
