import { Component, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common'; // Required if using *ngIf in standalone
import { Router } from '@angular/router';

// Import the components from your folder structure
import { ManageusersComponent } from './manageusers/manageusers.component';
import { SystemConfigComponent } from './system-config/system-config.component';
import { GeneratereportsComponent } from './generatereports/generatereports.component';
// Add ViewChild, ElementRef, and HostListener inside the curly braces

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule, 
    ManageusersComponent, // Add this
    SystemConfigComponent,
    GeneratereportsComponent  // Add this to fix NG8001
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent {
  activeTab = 'users';
  isDropdownOpen = false;

  constructor(private router: Router) {}

  // Reference to the profile section to check click location
  @ViewChild('profileContainer') profileContainer!: ElementRef;

  toggleDropdown(event: Event) {
    event.stopPropagation(); // Prevents the click from reaching the HostListener immediately
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  // AUTO-CLOSE LOGIC: Closes dropdown if you click anywhere else
  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (this.isDropdownOpen && this.profileContainer && !this.profileContainer.nativeElement.contains(event.target)) {
      this.isDropdownOpen = false;
    }
  }

  onLogout() {
    this.router.navigate(['']);
  }
}