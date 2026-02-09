import { Component, OnInit, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterModule } from '@angular/router';
import { ManagerDataService } from '../../core/services/manager-data.service';
import { AuthService } from '../../core/services/auth.service';
import { ProfileModalComponent } from '../../shared/profile-modal/profile-modal.component';

@Component({
  selector: 'app-manager',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, ProfileModalComponent],
  templateUrl: './manager.component.html',
  styleUrls: ['./manager.component.css']
})
export class ManagerComponent implements OnInit {
  @ViewChild(ProfileModalComponent) profileModal!: ProfileModalComponent;

  isDropdownOpen = false;
  user: any = { name: '', role: '', initial: '' };

  // Dashboard metrics
  totalMembers: number = 0;
  activeTasks: number = 0;
  totalHoursToday: number = 0;
  completionRate: number = 0;

  constructor(
    private router: Router,
    private dataService: ManagerDataService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    // Subscribe to user data for navbar
    this.dataService.currentUser$.subscribe(userData => {
      const fullName = userData.fullName || userData.name || 'Manager';
      
      this.user = {
        name: fullName,
        role: userData.role,
        initial: fullName.charAt(0).toUpperCase()
      };
    });

    // Calculate active tasks and completion rate
    this.dataService.tasks$.subscribe(tasks => {
      this.activeTasks = tasks.filter(t => t.status !== 'Completed').length;
      const completedTasks = tasks.filter(t => t.status === 'Completed').length;
      this.completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
    });

    // Get total team members count - Simple and direct
    this.dataService.teamMembers$.subscribe(count => {
      this.totalMembers = count;
    });

    // Calculate today's total hours from logs
    this.dataService.logs$.subscribe(logs => {
      const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const todayLogs = logs.filter(log => log.date === today);
      this.totalHoursToday = todayLogs.reduce((sum, log) => sum + log.totalHours, 0);
    });
  }

  // Toggle user profile dropdown
  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  // Close dropdown when clicking outside
  @HostListener('document:click')
  closeDropdown() {
    this.isDropdownOpen = false;
  }

  /**
   * Open the profile modal
   */
  openProfile() {
    this.isDropdownOpen = false; // Close dropdown
    if (this.profileModal) {
      this.profileModal.openProfile();
    }
  }

  // Navigate to different sections
  navigateTo(section: string) {
    this.router.navigate(['/manager', section]);
  }
  onLogout() {
    this.dataService.clearUser();
    this.authService.logout();
    this.router.navigate(['/signin']);
  }
}