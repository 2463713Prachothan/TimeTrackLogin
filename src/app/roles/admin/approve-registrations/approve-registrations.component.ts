import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RegistrationService, PendingRegistration } from '../../../core/services/registration.service';

@Component({
  selector: 'app-approve-registrations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './approve-registrations.component.html',
  styleUrls: ['./approve-registrations.component.css']
})
export class ApproveRegistrationsComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  pendingRegistrations: PendingRegistration[] = [];
  activeTab: 'pending' | 'approved' | 'rejected' = 'pending';
  isLoading = false;
  errorMessage = '';

  constructor(private registrationService: RegistrationService) {}

  ngOnInit() {
    // Only load in browser
    if (isPlatformBrowser(this.platformId)) {
      this.loadRegistrations();
    }
  }

  loadRegistrations() {
    this.isLoading = true;
    this.errorMessage = '';
    console.log('📡 ApproveRegistrationsComponent - Loading registrations...');
    
    this.registrationService.getPendingRegistrations().subscribe({
      next: (registrations) => {
        this.isLoading = false;
        console.log('✅ ApproveRegistrationsComponent - Received registrations:', registrations);
        // Backend /pending endpoint returns only pending items
        // Map them with status 'Pending' if not already set
        this.pendingRegistrations = registrations.map(r => ({
          ...r,
          status: r.status || 'Pending'
        }));
        console.log('✅ ApproveRegistrationsComponent - Mapped registrations:', this.pendingRegistrations);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load registrations. Check if backend is running.';
        console.error('❌ ApproveRegistrationsComponent - Error loading:', err);
      }
    });
  }

  get filteredRegistrations(): PendingRegistration[] {
    console.log('🔍 Filtering for tab:', this.activeTab, 'Total:', this.pendingRegistrations.length);
    if (this.activeTab === 'pending') {
      // For pending tab, show all (since backend /pending returns only pending)
      // or filter by status if available
      const filtered = this.pendingRegistrations.filter(r => 
        !r.status || r.status.toLowerCase() === 'pending'
      );
      console.log('🔍 Pending filtered:', filtered.length);
      return filtered;
    } else if (this.activeTab === 'approved') {
      return this.pendingRegistrations.filter(r => r.status?.toLowerCase() === 'approved');
    } else {
      return this.pendingRegistrations.filter(r => r.status?.toLowerCase() === 'rejected');
    }
  }

  approveRegistration(registration: PendingRegistration) {
    const displayName = registration.name || registration.fullName;
    const regId = registration.registrationId?.toString() || registration.id?.toString() || '';
    if (confirm(`Approve registration for ${displayName}?`)) {
      // Pass the full registration data so the service can add the user to localStorage
      this.registrationService.approveRegistration(regId, 'Admin', registration).subscribe(() => {
        this.loadRegistrations();
      });
    }
  }

  rejectRegistration(registration: PendingRegistration) {
    const displayName = registration.name || registration.fullName;
    const regId = registration.registrationId?.toString() || registration.id?.toString() || '';
    if (confirm(`Reject registration for ${displayName}?`)) {
      this.registrationService.rejectRegistration(regId).subscribe(() => {
        this.loadRegistrations();
      });
    }
  }

  deleteRegistration(registration: PendingRegistration) {
    const regId = registration.registrationId?.toString() || registration.id?.toString() || '';
    if (confirm(`Delete this registration?`)) {
      this.registrationService.deleteRegistration(regId);
    }
  }

  getPendingCount(): number {
    return this.pendingRegistrations.filter(r => r.status === 'Pending').length;
  }

  getApprovedCount(): number {
    return this.pendingRegistrations.filter(r => r.status === 'Approved').length;
  }

  getRejectedCount(): number {
    return this.pendingRegistrations.filter(r => r.status === 'Rejected').length;
  }
}
