import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LogHoursComponent } from "../loghours/loghours.component";
import { TasksComponent } from "../tasksassigned/tasksassigned.component";
import { PersonalreportsComponent } from '../personalreports/personalreports.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, LogHoursComponent, TasksComponent, PersonalreportsComponent],
  templateUrl: './dashboardemployee.component.html',
  styleUrl: './dashboardemployee.component.css',
})
export class DashboardemployeeComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  employeeName: string = 'Employee';
  userRole: string = 'Employee';
  activeTab: string = 'time-logging';

  ngOnInit() {
    // Get current user from AuthService
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      // Use fullName from registered data, not email
      this.employeeName = currentUser.fullName || 'Employee';
      this.userRole = currentUser.role || 'Employee';
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['']);
  }

  showDropdown: boolean = false;
  showNotifications: boolean = false; // Controls the bell dropdown
  unreadCount: number = 1;

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
    this.showNotifications = false; // Close others
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    this.showDropdown = false; // Close others
  }
}