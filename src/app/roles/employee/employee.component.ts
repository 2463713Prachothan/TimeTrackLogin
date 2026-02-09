import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TimeLogService } from '../../core/services/time-log.service';
import { ProfileModalComponent } from '../../shared/profile-modal/profile-modal.component';

@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ProfileModalComponent],
  templateUrl: './employee.component.html',
  styleUrl: './employee.component.css'
})
export class EmployeeComponent implements OnInit {
  @ViewChild(ProfileModalComponent) profileModal!: ProfileModalComponent;

  private router = inject(Router);
  private authService = inject(AuthService);
  private timeLogService = inject(TimeLogService);
  
  employeeName: string = 'Employee';
  userRole: string = 'Employee';
  profileInitial: string = 'E';
  showDropdown: boolean = false;

  ngOnInit() {
    // Get current user from AuthService
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      // Use fullName directly
      const fullName = currentUser.fullName || 'Employee';
      
      this.employeeName = fullName;
      this.userRole = currentUser.role || 'Employee';
      this.profileInitial = fullName.charAt(0).toUpperCase();
      
      console.log('Employee loaded:', {
        fullName: this.employeeName,
        role: this.userRole,
        initial: this.profileInitial
      });
    }
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  /**
   * Open the profile modal
   */
  openProfile() {
    this.showDropdown = false; // Close dropdown
    if (this.profileModal) {
      this.profileModal.openProfile();
    }
  }

  logout() {
    // Save the final time log before logging out
    this.timeLogService.saveDailyTimeLog();
    
    this.authService.logout();
    this.router.navigate(['/signin']);
  }
}
