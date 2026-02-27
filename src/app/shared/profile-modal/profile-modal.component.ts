import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ApiService } from '../../core/services/api.service';  // 👈 add

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
  private api = inject(ApiService);                               // 👈 add

  isOpen = false;
  currentUser: any = null;
  managerName: string = 'Not Assigned';
  assignedEmployeesCount = 0;
  assignedEmployeesNames: string[] = [];

  ngOnInit() {
    // Optional: don’t pre-load. We’ll load fresh on open.
  }

  openProfile() {
    this.isOpen = true;

    // 1) Always fetch a fresh profile from backend (so role/manager are current)
    this.api.getUserProfile().subscribe({
      next: (p) => {
        const profile = p?.data ?? p;              // unwrap { data } if present
        if (!profile) return;

        if (!profile.fullName && profile.name) {
          profile.fullName = profile.name;
        }
        this.currentUser = profile;

        // Employee → show manager
        this.managerName =
          profile.managerName ||
          profile.manager?.fullName ||
          profile.manager?.name ||
          this.userService.getUserById(profile.managerId || '')?.fullName ||
          'Not Assigned';

        // Manager → load team from backend (fresh)
        if (profile.role === 'Manager') {
          this.loadTeamFromBackend();              // 👈 use API, not local cache
        } else {
          this.assignedEmployeesNames = [];
          this.assignedEmployeesCount = 0;
        }
      },
      error: () => {
        // fallback to previous local method if you want:
        this.loadProfileDataFromLocal();
      }
    });
  }

private loadTeamFromBackend() {
  this.api.getMyTeam().subscribe({
    next: (team: any[]) => {
      // team is always an array (per ApiService), so this is safe.
      const names = team.map((m: any) =>
        m.fullName || m.name || m.email || '(no name)'
      );

      this.assignedEmployeesNames = names;
      this.assignedEmployeesCount = names.length;

      console.log('👥 Team names:', names);
    },
    error: () => {
      // This should rarely run because ApiService catchError returns [].
      // Keep as defensive fallback:
      this.assignedEmployeesNames = [];
      this.assignedEmployeesCount = 0;
    }
  });
}
  // --- fallbacks (optional) ---

  /** Previous local approach – used only as fallback */
  private loadProfileDataFromLocal() {
    const user = this.authService.currentUser();
    if (!user) return;
    if (!user.fullName && user.name) user.fullName = user.name;
    this.currentUser = user;

    if (user.role === 'Employee' && user.managerId) {
      const manager = this.userService.getUserById(user.managerId);
      this.managerName = manager?.fullName || 'Not Assigned';
    } else {
      this.managerName = 'Not Assigned';
    }

    if (user.role === 'Manager') {
      this.loadAssignedEmployeesFromCache();
    }
  }

  /** Old cache-based method – only accurate if refreshUsers ran recently */
  private loadAssignedEmployeesFromCache() {
    // Make sure the cache is fresh
    this.userService.refreshUsers();                          // 👈 important
    this.userService.getUsers().subscribe((users: any[]) => {
      const currentManager = users.find(u => u.id === this.currentUser.id);
      if (currentManager?.assignedEmployees?.length > 0) {
        const ids = currentManager.assignedEmployees;
        const assigned = users.filter(u => ids.includes(u.id));
        this.assignedEmployeesNames = assigned.map(emp => emp.fullName);
        this.assignedEmployeesCount = this.assignedEmployeesNames.length;
      } else {
        this.assignedEmployeesNames = [];
        this.assignedEmployeesCount = 0;
      }
    });
  }

  closeProfile() { this.isOpen = false; }

  getRoleBadgeClass(): string {
    if (!this.currentUser) return '';
    return `badge-${this.currentUser.role.toLowerCase()}`;
  }
}