import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-profile-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-modal.component.html',
  styleUrl: './profile-modal.component.css'
})
export class ProfileModalComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);

  isOpen = false;
  currentUser: any = null;
  managerName: string = '';
  assignedEmployeesCount: number = 0;
  assignedEmployeesNames: string[] = [];

  ngOnInit() {
    this.loadProfileData();
  }

  /**
   * Load current user profile data
   */
  loadProfileData() {
    const user = this.authService.currentUser();
    if (user) {
      // Ensure fullName is set from either fullName or name field
      if (!user.fullName && user.name) {
        user.fullName = user.name;
      }
      this.currentUser = user;
      
      // If user is an employee, get their manager's name
      if (user.role === 'Employee' && user.managerId) {
        const manager = this.userService.getUserById(user.managerId);
        this.managerName = manager?.fullName || 'Not Assigned';
      }
      
      // If user is a manager, get their assigned employees
      if (user.role === 'Manager') {
        this.loadAssignedEmployees();
      }
    }
  }

  /**
   * Load assigned employees for this manager
   */
  private loadAssignedEmployees() {
    this.userService.getUsers().subscribe((users: any[]) => {
      // Get the current manager's record
      const currentManager = users.find(u => u.id === this.currentUser.id);
      
      if (currentManager && currentManager.assignedEmployees && currentManager.assignedEmployees.length > 0) {
        // Get the names of assigned employees
        const employeeIds = currentManager.assignedEmployees;
        const assignedEmployees = users.filter(u => employeeIds.includes(u.id));
        
        this.assignedEmployeesNames = assignedEmployees.map(emp => emp.fullName);
        this.assignedEmployeesCount = this.assignedEmployeesNames.length;
      } else {
        this.assignedEmployeesNames = [];
        this.assignedEmployeesCount = 0;
      }
    });
  }

  /**
   * Open the profile modal
   */
  openProfile() {
    this.isOpen = true;
    this.loadProfileData();
  }

  /**
   * Close the profile modal
   */
  closeProfile() {
    this.isOpen = false;
  }

  /**
   * Get role badge color
   */
  getRoleBadgeClass(): string {
    if (!this.currentUser) return '';
    return `badge-${this.currentUser.role.toLowerCase()}`;
  }
}
