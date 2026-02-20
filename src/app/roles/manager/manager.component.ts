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
  ) {}

  ngOnInit() {
    // Navbar user info
    this.dataService.currentUser$.subscribe(userData => {
      const fullName = userData.fullName || userData.name || 'Manager';
      this.user = {
        name: fullName,
        role: userData.role,
        initial: fullName.charAt(0).toUpperCase()
      };
    });

    // Active tasks & completion rate (from data service)
    this.dataService.tasks$.subscribe(tasks => {
      const activeTasks = tasks.filter(t => t.status !== 'Completed').length;
      const completedTasks = tasks.filter(t => t.status === 'Completed').length;
      this.completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
      if (this.activeTasks === 0) {
        this.activeTasks = activeTasks;
      }
    });

    // === MAIN: all manager calls use GUID string ===
    const managerId = this.getCurrentManagerId(); // string | null
    if (managerId) {
      // Dashboard stats (prefers API, falls back to derived)
      this.timeLogService.getManagerStats(managerId).subscribe(stats => {
        if (stats) {
          // adjust keys if your API returns different names
          this.teamCount = (stats as any).teamCount ?? 0;
          this.activeTasks = (stats as any).activeTasks ?? this.activeTasks;
        } else {
          this.timeLogService.getTeamMembersCount(managerId).subscribe(teamCount => {
            this.teamCount = teamCount;
          });
        }
      });

      // Team members list (+ compute hours from team logs)
      this.loadTeamMembers(managerId);
    }
  }

  /**
   * Load team members and compute their total hours from team time logs
   */
  private loadTeamMembers(managerId: string): void {
    this.userService.getTeamMembers(managerId).subscribe(users => {
      this.timeLogService.getTeamTimeLogs(managerId).subscribe(logs => {
        this.teamMembers = users.map(user => {
          // If your TeamTimeLog includes employeeId, prefer ID match; else fallback to name
          const employeeLogs = logs.filter(log =>
            (log as any).employeeId && user.id
              ? (log as any).employeeId === user.id
              : (log.employeeName?.toLowerCase() === user.fullName?.toLowerCase())
          );
          const totalHours = employeeLogs.reduce((sum, log) => sum + (log.totalHours || 0), 0);

          return {
            id: user.id || '',
            name: user.fullName,
            email: user.email,
            totalHours,
            department: user.department,
            status: user.status
          };
        });

        if (this.teamMembers.length > 0) {
          this.teamCount = this.teamMembers.length;
        }
      });
    });
  }

  /**
   * Read current manager ID as GUID string from session.
   * NO number parsing. Returns null if missing.
   */
  private getCurrentManagerId(): string | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const saved = localStorage.getItem('user_session');
    if (!saved) return null;

    try {
      const user = JSON.parse(saved);
      const id = user.userId ?? user.id;  // depending on how you store it
      if (!id) return null;
      return typeof id === 'string' ? id : String(id);
    } catch {
      return null;
    }
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

  /** Open profile modal */
  openProfile() {
    this.isDropdownOpen = false;
    if (this.profileModal) {
      this.profileModal.openProfile();
    }
  }

  /** Navigate to a section under /manager */
  navigateTo(section: string) {
    this.router.navigate(['/manager', section]);
  }

  onLogout() {
    this.dataService.clearUser();
    this.authService.logout();
    this.router.navigate(['/signin']);
  }
}