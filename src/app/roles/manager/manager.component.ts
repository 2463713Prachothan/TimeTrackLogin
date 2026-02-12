import { Component, OnInit, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterModule } from '@angular/router';
import { ManagerDataService } from '../../core/services/manager-data.service';
import { TimeLogService } from '../../core/services/time-log.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ProfileModalComponent } from '../../shared/profile-modal/profile-modal.component';
import { TeamMember } from '../../core/models/time-log.model';

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
  teamCount: number = 0;
  activeTasks: number = 0;
  completionRate: number = 0;

  // Team members list
  teamMembers: TeamMember[] = [];

  constructor(
    private router: Router,
    private dataService: ManagerDataService,
    private authService: AuthService,
    private timeLogService: TimeLogService,
    private userService: UserService
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
      const activeTasks = tasks.filter(t => t.status !== 'Completed').length;
      const completedTasks = tasks.filter(t => t.status === 'Completed').length;
      this.completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
      // Only use local activeTasks if API doesn't provide it
      if (this.activeTasks === 0) {
        this.activeTasks = activeTasks;
      }
    });

    // Get dashboard stats from backend
    const managerId = this.getCurrentManagerId();
    if (managerId) {
      // Fetch dashboard stats
      this.timeLogService.getManagerStats(managerId).subscribe(stats => {
        if (stats) {
          this.teamCount = stats.teamCount ?? 0;
          this.activeTasks = stats.activeTasks ?? this.activeTasks;
        } else {
          // Fallback: calculate from team logs
          this.timeLogService.getTeamMembersCount(managerId).subscribe(teamCount => {
            this.teamCount = teamCount;
          });
        }
      });

      // Fetch team members list
      this.loadTeamMembers(managerId.toString());
    }
  }

  /**
   * Load team members and their hours from the API
   */
  private loadTeamMembers(managerId: string): void {
    this.userService.getTeamMembers(managerId).subscribe(users => {
      // Get time logs to calculate hours per employee
      this.timeLogService.getTeamTimeLogs(Number(managerId)).subscribe(logs => {
        this.teamMembers = users.map(user => {
          // Calculate total hours for this employee from time logs
          const employeeLogs = logs.filter(log => 
            log.employeeName?.toLowerCase() === user.fullName?.toLowerCase()
          );
          const totalHours = employeeLogs.reduce((sum, log) => sum + (log.totalHours || 0), 0);

          return {
            id: user.id || '',
            name: user.fullName,
            email: user.email,
            totalHours: totalHours,
            department: user.department,
            status: user.status
          };
        });
        
        // Update team count based on actual members
        if (this.teamMembers.length > 0) {
          this.teamCount = this.teamMembers.length;
        }
      });
    });
  }

  private getCurrentManagerId(): number | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('user_session');
      if (saved) {
        const user = JSON.parse(saved);
        const parsed = Number(user.userId ?? user.id);
        return Number.isNaN(parsed) ? null : parsed;
      }
    }
    return null;
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