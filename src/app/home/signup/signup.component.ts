import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { RegistrationService } from '../../core/services/registration.service';
 
@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private registrationService = inject(RegistrationService);
  signupForm: FormGroup;
  // This must be false for the password to be hidden (dotted) by default
  showPassword = false;
 
  // Roles for the dropdown
  roles: string[] = ['Employee', 'Manager'];
 
  // Departments for the dropdown
  departments: string[] = [
    'Dot-net Angular',
    'Java Angular',
    'Java React',
    'Multi cloud'
  ];
  constructor() {
    this.signupForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['', [Validators.required]],
      department: ['', [Validators.required]],
      password: ['', [
        Validators.required,
        // Enforces: 8+ chars, 1 Upper, 1 Lower, 1 Number, 1 Symbol
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }
 
  // Custom validator to ensure password and confirmPassword match
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }
 
  // Helper getter for easy access to form controls in the HTML template
  get f() { return this.signupForm.controls; }
 
  // Toggles the showPassword boolean when the eye icon is clicked
  togglePassword() {
    this.showPassword = !this.showPassword;
  }
 
  // Handles form submission
  onSubmit() {
    if (this.signupForm.valid) {
      const userData: any = {
        name: this.signupForm.value.fullName,
        fullName: this.signupForm.value.fullName,
        email: this.signupForm.value.email.toLowerCase(),
        role: this.signupForm.value.role,
        department: this.signupForm.value.department,
        password: this.signupForm.value.password
      };
 
      // Submit registration for admin approval (not direct registration)
      this.registrationService.addPendingRegistration(userData).subscribe({
        next: (response: any) => {
          console.log('Registration submitted for approval:', response);
 
          // Show notification that registration is pending approval
          this.notificationService.success(
            `Registration submitted for ${userData.name}! Please wait for admin approval before signing in.`
          );
 
          // Navigate to signin
          this.router.navigate(['/signin']);
        },
        error: (err: any) => {
          console.error('Registration submission failed:', err);
          // Parse ASP.NET Core validation errors
          if (err.error?.errors) {
            const validationErrors = err.error.errors;
            const messages = Object.keys(validationErrors)
              .map(key => {
                const val = validationErrors[key];
                return Array.isArray(val) ? val.join(', ') : String(val);
              })
              .join(' | ');
            this.notificationService.error(messages);
          } else {
            const message = err.error?.title || err.error?.message || 'Registration submission failed. Please try again.';
            this.notificationService.error(message);
          }
        }
      });
    } else {
      this.signupForm.markAllAsTouched();
    }
  }
}
 
 