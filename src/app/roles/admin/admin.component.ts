import { Component, HostListener, ElementRef, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterModule } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { ProfileModalComponent } from '../../shared/profile-modal/profile-modal.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, ProfileModalComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {
  isDropdownOpen = false;
  
  // User statistics
  totalEmployees = 0;
  activeEmployees = 0;
  inactiveEmployees = 0;
  totalManagers = 0;
  activeManagers = 0;
  inactiveManagers = 0;
  totalActiveUsers = 0;
  totalInactiveUsers = 0;
  
  // Filter states
  selectedFilter: 'none' | 'active' | 'inactive' = 'none';
  displayFilter: { label: string; count: number } | null = null;
  showingActiveInactive = false;

  constructor(private router: Router, private userService: UserService) {}

  // Reference to the profile section to check click location
  @ViewChild('profileContainer') profileContainer!: ElementRef;
  @ViewChild(ProfileModalComponent) profileModal!: ProfileModalComponent;

  ngOnInit() {
    this.loadUserStatistics();
    // Reload statistics every 2 seconds to reflect changes from manageusers
    setInterval(() => {
      this.loadUserStatistics();
    }, 2000);
  }

  loadUserStatistics() {
    this.userService.getUsers().subscribe(users => {
      // Calculate employee statistics
      const employees = users.filter(u => u.role === 'Employee');
      this.totalEmployees = employees.length;
      this.activeEmployees = employees.filter(u => u.status === 'Active').length;
      this.inactiveEmployees = employees.filter(u => u.status === 'Inactive').length;
      
      // Calculate manager statistics
      const managers = users.filter(u => u.role === 'Manager');
      this.totalManagers = managers.length;
      this.activeManagers = managers.filter(u => u.status === 'Active').length;
      this.inactiveManagers = managers.filter(u => u.status === 'Inactive').length;
      
      // Calculate total active/inactive users
      this.totalActiveUsers = this.activeEmployees + this.activeManagers;
      this.totalInactiveUsers = this.inactiveEmployees + this.inactiveManagers;
    });
  }

  selectFilter(filterType: 'none' | 'active' | 'inactive') {
    if (this.selectedFilter === filterType) {
      this.selectedFilter = 'none';
      this.displayFilter = null;
      this.showingActiveInactive = false;
    } else {
      this.selectedFilter = filterType;
      this.showingActiveInactive = true;
      if (filterType === 'active') {
        this.displayFilter = { label: 'Active Users', count: this.totalActiveUsers };
      } else if (filterType === 'inactive') {
        this.displayFilter = { label: 'Inactive Users', count: this.totalInactiveUsers };
      }
    }
  }

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

  openProfile() {
    this.isDropdownOpen = false; // Close dropdown
    if (this.profileModal) {
      this.profileModal.openProfile();
    }
  }
}