import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { LogHoursComponent } from "../loghours/loghours.component";
import { TasksComponent } from "../tasksassigned/tasksassigned.component";
import { PersonalreportsComponent } from '../personalreports/personalreports.component';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, LogHoursComponent, TasksComponent, PersonalreportsComponent],
  templateUrl: './dashboardemployee.component.html',
  styleUrl: './dashboardemployee.component.css',
})
export class DashboardemployeeComponent {
logout() {
throw new Error('Method not implemented.');
}
  employeeName: string = 'John Doe'; 
  userRole: string = 'Employee';
  activeTab: string = 'time-logging';
  
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