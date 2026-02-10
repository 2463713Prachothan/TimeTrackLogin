import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegistrationService, PendingRegistration } from '../../../core/services/registration.service';

@Component({
  selector: 'app-approve-registrations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './approve-registrations.component.html',
  styleUrls: ['./approve-registrations.component.css']
})
export class ApproveRegistrationsComponent implements OnInit {
  pendingRegistrations: PendingRegistration[] = [];
  activeTab: 'pending' | 'approved' | 'rejected' = 'pending';

  constructor(private registrationService: RegistrationService) {}

  ngOnInit() {
    this.loadRegistrations();
  }

  loadRegistrations() {
    this.registrationService.getPendingRegistrations().subscribe(registrations => {
      this.pendingRegistrations = registrations;
    });
  }

  get filteredRegistrations(): PendingRegistration[] {
    if (this.activeTab === 'pending') {
      return this.pendingRegistrations.filter(r => r.status === 'Pending');
    } else if (this.activeTab === 'approved') {
      return this.pendingRegistrations.filter(r => r.status === 'Approved');
    } else {
      return this.pendingRegistrations.filter(r => r.status === 'Rejected');
    }
  }

  approveRegistration(registration: PendingRegistration) {
    if (confirm(`Approve registration for ${registration.fullName}?`)) {
      this.registrationService.approveRegistration(registration.id || '');
    }
  }

  rejectRegistration(registration: PendingRegistration) {
    if (confirm(`Reject registration for ${registration.fullName}?`)) {
      this.registrationService.rejectRegistration(registration.id || '');
    }
  }

  deleteRegistration(registration: PendingRegistration) {
    if (confirm(`Delete this registration?`)) {
      this.registrationService.deleteRegistration(registration.id || '');
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
