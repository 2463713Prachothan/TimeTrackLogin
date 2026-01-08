import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { LogHoursComponent } from "../loghours/loghours.component";
import { TasksComponent } from "../tasksassigned/tasksassigned.component";

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, LogHoursComponent, TasksComponent],
  templateUrl: './dashboardemployee.component.html',
  styleUrl: './dashboardemployee.component.css',
})
export class DashboardemployeeComponent {
  employeeName = 'John Doe';
  // In a real app, fetch this from your Auth Service
  userRole = 'Employee';
  showDropdown = false;


  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  logout() {
    console.log('Logging out employee...'); //
    // Add your logout logic/redirection here
  }

  // Default to 'time-logging' as per the LLD primary feature
  activeTab: string = 'time-logging';

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}