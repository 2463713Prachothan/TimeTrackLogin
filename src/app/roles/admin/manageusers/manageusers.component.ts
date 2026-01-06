import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface User {
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  type: string;
}

@Component({
  selector: 'app-manageusers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manageusers.component.html',
  styleUrl: './manageusers.component.css'
})
export class ManageusersComponent {
  isModalOpen: boolean = false;
  isEditMode: boolean = false;
  editingUserEmail: string | null = null;
  searchTerm: string = '';

  newUser: User = {
    name: '',
    email: '',
    role: 'Employee',
    department: '.NET',
    status: 'Active',
    type: 'Demo'
  };

  allUsers: User[] = [
    { name: 'Kobikrishna', email: 'kobikrishna@company.com', role: 'Admin', department: 'Cloud', status: 'Active', type: 'Demo' },
    { name: 'Umesh', email: 'umesh@company.com', role: 'Manager', department: 'Java', status: 'Active', type: 'Demo' },
    { name: 'Chandhana', email: 'chandhana@company.com', role: 'Employee', department: '.NET', status: 'Active', type: 'Demo' },
    { name: 'Akash', email: 'Akash@company.com', role: 'Employee', department: '.NET', status: 'Active', type: 'Demo' },
    { name: 'Prachothan', email: 'Prachothan@company.com', role: 'Manager', department: 'Java', status: 'Active', type: 'Demo' }
  ];

  filteredUsers: User[] = [...this.allUsers];

  // --- STAT GETTERS (Fixes NG5002 Error) ---
  get totalUsersCount(): number {
    return this.allUsers.length;
  }

  get activeUsersCount(): number {
    return this.allUsers.filter(u => u.status === 'Active').length;
  }

  get inactiveUsersCount(): number {
    return this.allUsers.filter(u => u.status === 'Inactive').length;
  }

  // --- MODAL LOGIC ---
  openAddModal() {
    this.isEditMode = false;
    this.resetForm();
    this.isModalOpen = true;
  }

  openEditModal(user: User) {
    this.isEditMode = true;
    this.editingUserEmail = user.email;
    this.newUser = { ...user }; // Clone to avoid direct table mutation
    this.isModalOpen = true;
  }

  closeAddModal() {
    this.isModalOpen = false;
    this.resetForm();
  }

  resetForm() {
    this.newUser = {
      name: '',
      email: '',
      role: 'Employee',
      department: '.NET',
      status: 'Active',
      type: 'Demo'
    };
    this.editingUserEmail = null;
  }

  // --- ACTION HANDLERS ---
  saveUser() {
    if (this.newUser.name.trim() && this.newUser.email.trim()) {
      if (this.isEditMode && this.editingUserEmail) {
        // Update existing
        const index = this.allUsers.findIndex(u => u.email === this.editingUserEmail);
        if (index !== -1) {
          this.allUsers[index] = { ...this.newUser };
        }
      } else {
        // Add new
        this.allUsers.unshift({ ...this.newUser });
      }

      this.applySearch();
      this.closeAddModal();
    } else {
      alert("Please enter both Name and Email.");
    }
  }

  toggleStatus(user: User) {
    user.status = user.status === 'Active' ? 'Inactive' : 'Active';
    // We don't necessarily need to re-run applySearch unless searching by status
  }

  deleteUser(email: string) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.allUsers = this.allUsers.filter(u => u.email !== email);
      this.applySearch();
    }
  }

  // --- SEARCH ---
  applySearch() {
    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = this.allUsers.filter(user =>
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.role.toLowerCase().includes(term)
    );
  }
}